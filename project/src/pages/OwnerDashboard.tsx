import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ChevronDown, ChevronUp, Filter, MapPin, Clock, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import BottomNav, { type NavTab } from '../components/BottomNav';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import { createMarkerIcon, TILE_URL, TILE_ATTRIBUTION, GPS_PATH_COLOR } from '../lib/mapConstants';
import FlyToLocation from '../components/FlyToLocation';
import { DEFAULT_CENTER } from '../lib/geo';
import { getDriverInitials } from '../lib/driverUtils';
import { formatLastSeen, formatDate, formatTime, formatDuration, formatDistance } from '../lib/formatters';
import type { Driver, DriverCurrentLocation, Trip } from '../lib/types';

interface OwnerDashboardProps {
  onBack: () => void;
}

export default function OwnerDashboard({ onBack: _onBack }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('map');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<Record<string, DriverCurrentLocation>>({});
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [filterDriver, setFilterDriver] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    loadDrivers();
    loadLocations();
    const unsub1 = subscribeToLocations();
    const unsub2 = subscribeToDrivers();
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && trips.length === 0 && !tripsLoading) {
      loadTrips();
    }
  }, [activeTab]);

  async function loadDrivers() {
    const { data } = await supabase.from('drivers').select('*').order('name');
    if (data) setDrivers(data);
    setLoading(false);
  }

  async function loadLocations() {
    const { data } = await supabase.from('driver_current_location').select('*');
    if (data) {
      const map: Record<string, DriverCurrentLocation> = {};
      data.forEach((loc: DriverCurrentLocation) => {
        map[loc.driver_id] = loc;
      });
      setLocations(map);
    }
  }

  function subscribeToLocations() {
    const channel = supabase
      .channel('owner-locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_current_location' },
        (payload) => {
          const loc = payload.new as DriverCurrentLocation;
          setLocations(prev => ({ ...prev, [loc.driver_id]: loc }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  function subscribeToDrivers() {
    const channel = supabase
      .channel('owner-drivers')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'drivers' },
        (payload) => {
          const updated = payload.new as Driver;
          setDrivers(prev =>
            prev.map(d => d.id === updated.id ? updated : d)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  async function loadTrips() {
    setTripsLoading(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'completed')
      .order('start_time', { ascending: false })
      .limit(100);
    if (data) setTrips(data);
    setTripsLoading(false);
  }

  const activeCount = drivers.filter(d => d.status === 'on_trip').length;

  const handleSelectDriver = (driverId: string) => {
    setSelectedDriver(prev => prev === driverId ? null : driverId);
    if (locations[driverId]) {
      setActiveTab('map');
    }
  };

  const selectedLoc = selectedDriver ? locations[selectedDriver] : null;
  const mapCenter: [number, number] = selectedLoc
    ? [selectedLoc.lat, selectedLoc.lng]
    : DEFAULT_CENTER;

  const filteredTrips = trips.filter(t => {
    const matchDriver = !filterDriver || t.driver_name.toLowerCase().includes(filterDriver.toLowerCase());
    const matchDate = !filterDate || t.start_time.startsWith(filterDate);
    return matchDriver && matchDate;
  });

  return (
    <div className="page-container">
      <Header
        subtitle="Owner Dashboard"
        showActiveCount={activeCount}
      />

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="relative">
          <div className="rounded-none overflow-hidden" style={{ height: '60vh' }}>
            <MapContainer
              center={mapCenter}
              zoom={5}
              scrollWheelZoom={true}
              style={{ height: '60vh', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution={TILE_ATTRIBUTION}
                url={TILE_URL}
              />
              {selectedLoc && (
                <FlyToLocation lat={selectedLoc.lat} lng={selectedLoc.lng} />
              )}
              {Object.values(locations).map(loc => (
                <Marker
                  key={loc.driver_id}
                  position={[loc.lat, loc.lng]}
                  icon={createMarkerIcon(loc.status)}
                >
                  <Popup>
                    <div className="text-xs font-semibold">
                      {drivers.find(d => d.id === loc.driver_id)?.name || loc.driver_id}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Selected driver info overlay */}
          {selectedDriver && (
            <div className="absolute bottom-4 left-4 right-4 glass-card p-3 z-[1000]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    {drivers.find(d => d.id === selectedDriver)?.name}
                  </p>
                  <StatusBadge status={drivers.find(d => d.id === selectedDriver)?.status || 'idle'} />
                </div>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="p-4 space-y-2">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            All Drivers ({drivers.length})
          </h2>
          {loading ? (
            <SkeletonLoader rows={6} />
          ) : (
            drivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => handleSelectDriver(driver.id)}
                className={`w-full glass-card p-4 flex items-center gap-3 transition-all duration-300 active:scale-[0.98] text-left ${
                  selectedDriver === driver.id ? 'ring-1 ring-brand-500/50' : ''
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                  driver.status === 'on_trip'
                    ? 'bg-brand-500/15 text-brand-500'
                    : driver.status === 'completed'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-yellow-500/15 text-yellow-400'
                }`}>
                  {getDriverInitials(driver.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white truncate">{driver.name}</p>
                    <StatusBadge status={driver.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      {driver.students.length} students
                    </span>
                    {driver.last_seen && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastSeen(driver.last_seen)}
                      </span>
                    )}
                    {locations[driver.id] && (
                      <span className="flex items-center gap-1 text-brand-400">
                        <MapPin className="w-3 h-3" />
                        Live
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Trip History
          </h2>

          {/* Filters */}
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-semibold">Filters</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Driver name..."
                value={filterDriver}
                onChange={e => setFilterDriver(e.target.value)}
                className="bg-surface-hover border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50"
              />
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-surface-hover border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>

          {tripsLoading ? (
            <SkeletonLoader rows={5} />
          ) : filteredTrips.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">No completed trips yet</p>
          ) : (
            <div className="space-y-2">
              {filteredTrips.map(trip => (
                <div
                  key={trip.id}
                  className="glass-card p-3 cursor-pointer transition-all duration-300 active:scale-[0.99]"
                  onClick={() => setExpandedTrip(prev => prev === trip.id ? null : trip.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{trip.driver_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(trip.start_time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatDuration(trip.duration_seconds)}
                      </span>
                      <span className="text-xs text-brand-400">
                        {formatDistance(trip.distance_meters)}
                      </span>
                      {expandedTrip === trip.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {expandedTrip === trip.id && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Start</span>
                          <p className="text-white">{formatTime(trip.start_time)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">End</span>
                          <p className="text-white">{trip.end_time ? formatTime(trip.end_time) : '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration</span>
                          <p className="text-white">{formatDuration(trip.duration_seconds)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Distance</span>
                          <p className="text-white">{formatDistance(trip.distance_meters)}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Students</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trip.students.map((s, i) => (
                            <span key={i} className="text-[10px] bg-surface-hover text-gray-300 px-2 py-0.5 rounded-pill">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      {trip.gps_path && trip.gps_path.length > 1 && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-white/5" style={{ height: 150 }}>
                          <MapContainer
                            center={[trip.gps_path[0].lat, trip.gps_path[0].lng]}
                            zoom={13}
                            scrollWheelZoom={false}
                            style={{ height: 150, width: '100%' }}
                            dragging={false}
                            zoomControl={false}
                          >
                            <TileLayer
                              url={TILE_URL}
                            />
                            <Polyline
                              positions={trip.gps_path.map(p => [p.lat, p.lng])}
                              color={GPS_PATH_COLOR}
                              weight={2}
                            />
                          </MapContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}


