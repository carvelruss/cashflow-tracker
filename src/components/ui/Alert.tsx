import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const config: Record<AlertVariant, { icon: ReactNode; classes: string }> = {
  info: { icon: <Info className="w-4 h-4" />, classes: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300' },
  success: { icon: <CheckCircle2 className="w-4 h-4" />, classes: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' },
  warning: { icon: <AlertCircle className="w-4 h-4" />, classes: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300' },
  error: { icon: <XCircle className="w-4 h-4" />, classes: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' },
};

export default function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { icon, classes } = config[variant];
  return (
    <div className={cn('flex gap-3 p-3 rounded-lg border text-sm', classes, className)}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        {children}
      </div>
    </div>
  );
}
