import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Users, Clock, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGps } from '../hooks/useGps';
import { useTripTimer } from '../hooks/useTripTimer';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import type { Driver, DriverStatus, GpsPoint } from '../lib/types';

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface DriverPageProps {
  driverId: string;
  onBack: () => void;
}

function FlyToCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

export default function DriverPage({ driverId, onBack }: DriverPageProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripStartTime, setTripStartTime] = useState<string | null>(null);
  const [gpsPath, setGpsPath] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gpsPathRef = useRef<GpsPoint[]>([]);

  const { position, isTracking, startTracking, stopTracking } = useGps(8000);
  const { display: timerDisplay } = useTripTimer(tripStartTime);

  useEffect(() => {
    loadDriver();
  }, [driverId]);

  async function loadDriver() {
    const { data, error: fetchError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to load driver:', fetchError.message);
      setError('Failed to load driver profile. Please try again.');
      setLoading(false);
      return;
    }

    if (data) {
      setDriver(data);
      if (data.status === 'on_trip') {
        resumeActiveTrip(data.id);
      }
    }
    setLoading(false);
  }

  async function resumeActiveTrip(drvId: string) {
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', drvId)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tripError) {
      console.error('Failed to resume active trip:', tripError.message);
      setError('Failed to resume active trip. Please try again.');
      return;
    }

    if (trip) {
      setTripId(trip.id);
      setTripStartTime(trip.start_time);
      setGpsPath(trip.gps_path || []);
      gpsPathRef.current = trip.gps_path || [];
      startTracking();
    }
  }

  useEffect(() => {
    if (!position || !tripId || !isTracking) return;

    const point: GpsPoint = {
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date(position.timestamp).toISOString(),
    };

    gpsPathRef.current = [...gpsPathRef.current, point];
    if (gpsPathRef.current.length > 500) {
      gpsPathRef.current = gpsPathRef.current.slice(-500);
    }
    setGpsPath([...gpsPathRef.current]);

    Promise.all([
      supabase.from('driver_current_location').upsert({
        driver_id: driverId,
        lat: position.lat,
        lng: position.lng,
        timestamp: new Date().toISOString(),
        status: 'on_trip' as DriverStatus,
      }),
      supabase.from('driver_locations').insert({
        driver_id: driverId,
        lat: position.lat,
        lng: position.lng,
        timestamp: new Date().toISOString(),
        status: 'on_trip' as DriverStatus,
      }),
      supabase.from('trips').update({
        gps_path: gpsPathRef.current,
      }).eq('id', tripId),
      supabase.from('drivers').update({
        last_seen: new Date().toISOString(),
      }).eq('id', driverId),
    ]).then(results => {
      for (const result of results) {
        if (result.error) {
          console.error('GPS sync error:', result.error.message);
        }
      }
    });
  }, [position, tripId, isTracking, driverId]);

  const handleStartTrip = useCallback(async () => {
    if (!driver || starting) return;
    setStarting(true);

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        driver_id: driver.id,
        driver_name: driver.name,
        students: driver.students,
        status: 'active',
        gps_path: [],
      })
      .select()
      .maybeSingle();

    if (tripError) {
      console.error('Failed to start trip:', tripError.message);
      setError('Failed to start trip. Please try again.');
      setStarting(false);
      return;
    }

    if (trip) {
      setTripId(trip.id);
      setTripStartTime(trip.start_time);
      gpsPathRef.current = [];
      setGpsPath([]);
    }

    const { error: statusError } = await supabase
      .from('drivers')
      .update({ status: 'on_trip' })
      .eq('id', driver.id);

    if (statusError) {
      console.error('Failed to update driver status:', statusError.message);
    }

    setError(null);
    setDriver(prev => prev ? { ...prev, status: 'on_trip' } : prev);
    startTracking();
    setStarting(false);
  }, [driver, starting, startTracking]);

  const handleEndTrip = useCallback(async () => {
    if (!driver || !tripId || ending) return;
    setEnding(true);

    stopTracking();

    const endTime = new Date().toISOString();
    const durationSec = tripStartTime
      ? Math.floor((Date.now() - new Date(tripStartTime).getTime()) / 1000)
      : 0;

    const distance = calculateDistance(gpsPathRef.current);

    const { error: tripUpdateError } = await supabase
      .from('trips')
      .update({
        end_time: endTime,
        duration_seconds: durationSec,
        distance_meters: distance,
        gps_path: gpsPathRef.current,
        status: 'completed',
      })
      .eq('id', tripId);

    if (tripUpdateError) {
      console.error('Failed to end trip:', tripUpdateError.message);
      setError('Failed to save trip data. Please try again.');
      setEnding(false);
      startTracking();
      return;
    }

    const { error: driverUpdateError } = await supabase
      .from('drivers')
      .update({ status: 'completed' })
      .eq('id', driver.id);

    if (driverUpdateError) {
      console.error('Failed to update driver status:', driverUpdateError.message);
    }

    const { error: locUpdateError } = await supabase
      .from('driver_current_location')
      .update({ status: 'completed' })
      .eq('driver_id', driver.id);

    if (locUpdateError) {
      console.error('Failed to update driver location status:', locUpdateError.message);
    }

    setError(null);
    setTripId(null);
    setTripStartTime(null);
    setGpsPath([]);
    gpsPathRef.current = [];
    setDriver(prev => prev ? { ...prev, status: 'completed' } : prev);
    setEnding(false);
  }, [driver, tripId, ending, stopTracking, startTracking, tripStartTime]);

  if (loading) {
    return (
      <div className="page-container">
        <Header subtitle="Driver App" />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="page-container">
        <Header subtitle="Driver App" />
        <div className="p-4 text-center">
          <p className="text-gray-400">{error || 'Driver not found'}</p>
          <button onClick={onBack} className="mt-4 text-brand-500 text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOnTrip = driver.status === 'on_trip';
  const mapCenter: [number, number] = position
    ? [position.lat, position.lng]
    : [20.5937, 78.9629];

  return (
    <div className="page-container">
      <Header subtitle={`Driver: ${driver.name}`} />

      <div className="p-4 space-y-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-400 text-sm hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Drivers</span>
        </button>

        {/* Driver Card */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{driver.name}</h2>
              <StatusBadge status={driver.status} />
            </div>
            {isTracking && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-brand-500 animate-pulse-dot" />
                <span className="text-xs font-semibold text-brand-400">GPS Active</span>
              </div>
            )}
          </div>

          {/* Students */}
          <div className="flex items-start gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {driver.students.map((s, i) => (
                <span
                  key={i}
                  className="text-xs bg-surface-hover text-gray-300 px-2 py-1 rounded-pill"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-3 rounded-btn">
              <p className="text-red-400 text-xs flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 text-xs font-semibold ml-2 hover:underline">Dismiss</button>
            </div>
          )}

          {/* Trip Timer */}
          {isOnTrip && tripStartTime && (
            <div className="flex items-center gap-2 bg-brand-500/10 p-3 rounded-btn">
              <Clock className="w-4 h-4 text-brand-400" />
              <span className="text-brand-400 font-mono font-bold text-lg">{timerDisplay}</span>
              <span className="text-xs text-brand-500/70">trip duration</span>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="rounded-card overflow-hidden border border-white/5" style={{ minHeight: '55vh' }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '55vh', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {position && (
              <>
                <FlyToCenter lat={position.lat} lng={position.lng} />
                <Marker position={[position.lat, position.lng]} icon={greenIcon} />
              </>
            )}
            {gpsPath.length > 1 && (
              <Polyline
                positions={gpsPath.map(p => [p.lat, p.lng])}
                color="#22c55e"
                weight={3}
                opacity={0.8}
              />
            )}
          </MapContainer>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isOnTrip ? (
            <button
              onClick={handleStartTrip}
              disabled={starting}
              className="btn-green flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              {starting ? 'Starting...' : 'START TRIP'}
            </button>
          ) : (
            <button
              onClick={handleEndTrip}
              disabled={ending}
              className="btn-red flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              {ending ? 'Ending...' : 'END TRIP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateDistance(points: GpsPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const R = 6371000;
    const dLat = ((points[i].lat - points[i - 1].lat) * Math.PI) / 180;
    const dLng = ((points[i].lng - points[i - 1].lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((points[i - 1].lat * Math.PI) / 180) *
        Math.cos((points[i].lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total);
}
