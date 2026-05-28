import { Map, Users, Clock } from 'lucide-react';

export type NavTab = 'map' | 'drivers' | 'history';

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const tabs: { id: NavTab; label: string; icon: typeof Map }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'history', label: 'History', icon: Clock },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card !rounded-none border-x-0 border-b-0">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'text-brand-500 bg-brand-500/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
