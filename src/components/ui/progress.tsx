import React from 'react';
import { cn } from '@/lib/utils';
import { BudgetHealthStatus } from '@/lib/types';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100+
  max?: number;
  status?: BudgetHealthStatus;
}

export function Progress({ value, max = 100, status, className, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  // Status colors that do not shame the user
  let barColor = 'bg-emerald-500';
  if (status === 'warning') barColor = 'bg-amber-500';
  if (status === 'critical') barColor = 'bg-orange-500';
  if (status === 'exceeded') barColor = 'bg-rose-500';

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-300 rounded-full', barColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
