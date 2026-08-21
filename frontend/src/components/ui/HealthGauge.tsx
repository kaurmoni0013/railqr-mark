import clsx from 'clsx';

interface HealthGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

function getColor(score: number): string {
  if (score > 70) return '#16A34A';
  if (score >= 40) return '#F59E0B';
  return '#DC2626';
}

function getLabel(score: number): string {
  if (score > 70) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export default function HealthGauge({ score, size = 120, className }: HealthGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = getColor(clamped);
  const label = getLabel(clamped);
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div className={clsx('flex flex-col items-center gap-1.5', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Value */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{ fontSize: size * 0.24, color }}
          >
            {clamped}
          </span>
          <span
            className="font-medium leading-none"
            style={{ fontSize: size * 0.1, color }}
          >
            {label}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">Health Score</span>
    </div>
  );
}
