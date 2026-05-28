export type DriverStatus = 'idle' | 'on_trip' | 'completed';

export interface Driver {
  id: string;
  name: string;
  students: string[];
  status: DriverStatus;
  last_seen: string | null;
}

export interface DriverLocation {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  status: DriverStatus;
}

export interface DriverCurrentLocation {
  driver_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  driver_id: string;
  driver_name: string;
  students: string[];
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  distance_meters: number;
  gps_path: GpsPoint[];
  status: 'active' | 'completed';
}

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: string;
}
