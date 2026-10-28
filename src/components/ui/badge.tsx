import React from 'react';
import { cn } from '@/lib/utils';
import { BudgetHealthStatus } from '@/lib/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'critical' | 'exceeded';
  status?: BudgetHealthStatus;
}

export function Badge({ className, variant = 'default', status, children, ...props }: BadgeProps) {
  let activeVariant = variant;
  if (status) {
    if (status === 'normal') activeVariant = 'success';
    if (status === 'warning') activeVariant = 'warning';
    if (status === 'critical') activeVariant = 'critical';
    if (status === 'exceeded') activeVariant = 'exceeded';
  }

  const variants = {
    default: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    critical: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    exceeded: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
        variants[activeVariant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
