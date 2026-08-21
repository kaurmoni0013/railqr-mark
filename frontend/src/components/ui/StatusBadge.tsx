import clsx from 'clsx';

type StatusType =
  | 'HEALTHY'
  | 'ATTENTION'
  | 'CRITICAL'
  | 'UNDER_MAINTENANCE'
  | 'RETIRED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'ASSIGNED'
  | 'CLOSED'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusStyles: Record<string, { bg: string; dot: string; text: string }> = {
  HEALTHY: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  ATTENTION: { bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700' },
  CRITICAL: { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700' },
  UNDER_MAINTENANCE: { bg: 'bg-purple-50', dot: 'bg-purple-500', text: 'text-purple-700' },
  RETIRED: { bg: 'bg-gray-100', dot: 'bg-gray-400', text: 'text-gray-600' },
  SCHEDULED: { bg: 'bg-blue-50', dot: 'bg-blue-500', text: 'text-blue-700' },
  IN_PROGRESS: { bg: 'bg-indigo-50', dot: 'bg-indigo-500', text: 'text-indigo-700' },
  COMPLETED: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  OVERDUE: { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700' },
  ASSIGNED: { bg: 'bg-cyan-50', dot: 'bg-cyan-500', text: 'text-cyan-700' },
  CLOSED: { bg: 'bg-gray-100', dot: 'bg-gray-400', text: 'text-gray-600' },
  LOW: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  MEDIUM: { bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700' },
  HIGH: { bg: 'bg-orange-50', dot: 'bg-orange-500', text: 'text-orange-700' },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-1.5',
};

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

const fallback = { bg: 'bg-gray-50', dot: 'bg-gray-400', text: 'text-gray-600' };

export default function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const style = statusStyles[status] ?? fallback;

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium leading-none',
        style.bg,
        style.text,
        sizeStyles[size],
        className,
      )}
    >
      <span className={clsx('rounded-full', style.dot, dotSizes[size])} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
