import { Leaf } from 'lucide-react';

interface HeaderProps {
  subtitle?: string;
  showActiveCount?: number;
}

export default function Header({ subtitle, showActiveCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass-card !rounded-none border-x-0 border-t-0 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Jevil Travels
            </h1>
            <p className="text-[10px] text-gray-400 leading-tight">
              {subtitle || 'Your Journey is Our Priority.'}
            </p>
          </div>
        </div>
        {showActiveCount !== undefined && (
          <div className="flex items-center gap-1.5 bg-brand-500/15 px-3 py-1.5 rounded-pill">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-dot" />
            <span className="text-xs font-semibold text-brand-400">
              {showActiveCount} Active
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
