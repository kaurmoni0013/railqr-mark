import clsx from 'clsx';

interface SkeletonCardProps {
  className?: string;
  height?: number | string;
}

export function SkeletonCard({ className, height = 180 }: SkeletonCardProps) {
  return (
    <div
      className={clsx(
        'skeleton rounded-xl',
        className,
      )}
      style={{ height, width: '100%' }}
    />
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, cols = 4, className }: SkeletonTableProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      {/* Header row */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, ci) => (
          <div
            key={ci}
            className="skeleton h-4 flex-1 rounded"
          />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4">
          {Array.from({ length: cols }).map((_, ci) => (
            <div
              key={ci}
              className="skeleton h-10 flex-1 rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const widths = ['100%', '92%', '78%', '85%', '60%', '95%', '70%'];
  return (
    <div className={clsx('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3.5 rounded"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}
