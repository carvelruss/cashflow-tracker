import { cn } from '../../utils/cn';

type Color = 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'sky';
type Size = 'xs' | 'sm' | 'md';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: Color;
  size?: Size;
  showLabel?: boolean;
  className?: string;
}

const colorMap: Record<Color, string> = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  purple: 'bg-violet-500',
  sky: 'bg-sky-500',
};

const sizeMap: Record<Size, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
};

export default function ProgressBar({ value, max = 100, color = 'primary', size = 'sm', showLabel, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden', sizeMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">{pct.toFixed(0)}%</p>
      )}
    </div>
  );
}
