'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

type StatusBadgeProps = {
  status: string;
  variant?: StatusVariant;
  className?: string;
};

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  return (
    <Badge className={cn('font-medium', variantStyles[variant], className)} variant="secondary">
      {status}
    </Badge>
  );
}
