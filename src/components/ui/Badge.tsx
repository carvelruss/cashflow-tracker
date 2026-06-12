import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'sky';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md';
  className?: string;
}

const variantMap: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  info: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400',
  purple: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
};

const sizeMap = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1' };

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-medium rounded-full', variantMap[variant], sizeMap[size], className)}>
      {children}
    </span>
  );
}
