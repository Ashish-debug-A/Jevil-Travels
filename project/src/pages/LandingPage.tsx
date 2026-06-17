import { useState, useEffect } from 'react';
import { Leaf, ChevronRight, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getDriverInitials } from '../lib/driverUtils';
import type { Driver } from '../lib/types';
import SkeletonLoader from '../components/SkeletonLoader';

interface LandingPageProps {
  onSelectDriver: (driverId: string) => void;
  onOpenOwner: () => void;
}

export default function LandingPage({ onSelectDriver, onOpenOwner }: LandingPageProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    const cached = localStorage.getItem('jevil_drivers');
    if (cached) {
      try {
        setDrivers(JSON.parse(cached));
        setLoading(false);
      } catch { /* ignore */ }
    }

    const { data } = await supabase
      .from('drivers')
      .select('*')
      .order('name');

    if (data) {
      setDrivers(data);
      localStorage.setItem('jevil_drivers', JSON.stringify(data));
    }
    setLoading(false);
  }

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 pt-12 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-brand-500/15 flex items-center justify-center mb-4 border border-brand-500/20">
            <Leaf className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Jevil Travels
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            Your Journey is Our Priority.
          </p>
          <p className="text-xs text-gray-500 mt-4 max-w-xs">
            Select your driver profile to start tracking, or access the owner dashboard.
          </p>
        </div>
      </div>

      {/* Owner Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onOpenOwner}
          className="w-full glass-card p-4 flex items-center gap-3 transition-all duration-300 hover:bg-surface-hover active:scale-[0.98] group"
        >
          <div className="w-12 h-12 rounded-full bg-brand-500/15 flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-bold text-white">Owner Dashboard</p>
            <p className="text-xs text-gray-400">Track all drivers in real-time</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-brand-500 transition-colors" />
        </button>
      </div>

      {/* Driver Selection */}
      <div className="px-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Select Your Driver Profile
        </h2>

        <div className="mb-3">
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-card border border-white/5 rounded-btn px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>

        {loading ? (
          <SkeletonLoader rows={6} />
        ) : (
          <div className="space-y-2">
            {filtered.map((driver) => (
              <button
                key={driver.id}
                onClick={() => onSelectDriver(driver.id)}
                className="w-full glass-card p-4 flex items-center gap-3 transition-all duration-300 hover:bg-surface-hover active:scale-[0.98] text-left group"
              >
                <div className="w-11 h-11 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-500 font-bold text-sm">
                  {getDriverInitials(driver.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{driver.name}</p>
                  <p className="text-xs text-gray-500">{driver.students.length} students assigned</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">No drivers found</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 pb-6 px-4 text-center">
        <p className="text-[10px] text-gray-600">
          Jevil Travels &middot; Eco-Friendly College Transport
        </p>
      </div>
    </div>
  );
}
