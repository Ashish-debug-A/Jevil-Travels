import type { DriverStatus } from '../lib/types';

const statusConfig: Record<DriverStatus, { label: string; className: string }> = {
  idle: { label: 'Idle', className: 'status-idle' },
  on_trip: { label: 'On Trip', className: 'status-on_trip' },
  completed: { label: 'Completed', className: 'status-completed' },
};

interface StatusBadgeProps {
  status: DriverStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <span className={config.className}>{config.label}</span>;
}
