'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ActionableInsight } from '@/lib/types';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuggestedNextStepsProps {
  insights: ActionableInsight[];
}

export function SuggestedNextSteps({ insights }: SuggestedNextStepsProps) {
  if (insights.length === 0) return null;

  return (
    <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/30 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Suggested Next Steps</CardTitle>
            <CardDescription className="text-xs">
              Clear, transparent recommendations driven by your actual recorded numbers
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {insights.map((insight) => {
          let Icon = Info;
          let badgeBorder = 'border-blue-200 bg-blue-50/60 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200';
          let iconColor = 'text-blue-600 dark:text-blue-400';

          if (insight.type === 'warning') {
            Icon = AlertTriangle;
            badgeBorder = 'border-amber-200 bg-amber-50/60 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200';
            iconColor = 'text-amber-600 dark:text-amber-400';
          } else if (insight.type === 'alert') {
            Icon = AlertCircle;
            badgeBorder = 'border-rose-200 bg-rose-50/60 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200';
            iconColor = 'text-rose-600 dark:text-rose-400';
          } else if (insight.type === 'success') {
            Icon = CheckCircle;
            badgeBorder = 'border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200';
            iconColor = 'text-emerald-600 dark:text-emerald-400';
          }

          return (
            <div
              key={insight.id}
              className={`rounded-xl border p-3.5 transition-all ${badgeBorder}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
                  <div>
                    <h4 className="text-sm font-semibold">{insight.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {insight.message}
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Data Cause:</span>
                      {insight.reason}
                    </p>
                  </div>
                </div>

                {insight.actionHref && insight.actionLabel && (
                  <Link href={insight.actionHref} className="shrink-0 self-center">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8 bg-white dark:bg-slate-800">
                      <span>{insight.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
