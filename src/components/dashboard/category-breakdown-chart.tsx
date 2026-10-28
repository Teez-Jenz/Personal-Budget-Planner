'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatCurrency, fromMinorUnits } from '@/lib/currency';
import { CategoryBudgetAnalysis, CurrencyCode } from '@/lib/types';
import { Table, PieChart as PieIcon } from 'lucide-react';

interface CategoryBreakdownChartProps {
  categoryBudgets: CategoryBudgetAnalysis[];
  currency: CurrencyCode;
}

export function CategoryBreakdownChart({ categoryBudgets, currency }: CategoryBreakdownChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Filter only categories with actual spend
  const activeCategories = categoryBudgets.filter((c) => c.spentMinor > 0);
  const totalSpendMinor = activeCategories.reduce((sum, c) => sum + c.spentMinor, 0);

  const chartData = activeCategories.map((c) => ({
    name: c.categoryName,
    value: fromMinorUnits(c.spentMinor, currency),
    color: c.categoryColor || '#6366f1',
    spentMinor: c.spentMinor,
    percentage: totalSpendMinor > 0 ? ((c.spentMinor / totalSpendMinor) * 100).toFixed(1) : '0',
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
          <CardDescription>Where your funds went during this period</CardDescription>
        </div>
        <button
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label={showTable ? 'Switch to pie chart view' : 'Switch to accessible breakdown table'}
        >
          {showTable ? (
            <>
              <PieIcon className="h-3.5 w-3.5" /> Chart View
            </>
          ) : (
            <>
              <Table className="h-3.5 w-3.5" /> Accessible Table
            </>
          )}
        </button>
      </CardHeader>

      <CardContent className="pt-2 flex-1 min-h-[260px]">
        {activeCategories.length === 0 ? (
          <div className="flex h-52 flex-col items-center justify-center text-center text-slate-400">
            <p className="text-sm">No expenses recorded for this period.</p>
          </div>
        ) : showTable ? (
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-3 font-semibold">Category</th>
                  <th className="py-2 px-3 font-semibold">Spent</th>
                  <th className="py-2 px-3 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {chartData.map((row) => (
                  <tr key={row.name}>
                    <td className="py-2 px-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="font-medium">{row.name}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {formatCurrency(row.spentMinor, currency)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">
                      {row.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-60">
            <div className="h-full w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${currency} ${Number(val).toLocaleString()}`, 'Spent']}
                    contentStyle={{
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom accessible legend */}
            <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-slate-700 dark:text-slate-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium shrink-0">
                    <span>{formatCurrency(item.spentMinor, currency)}</span>
                    <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
