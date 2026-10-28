'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatCurrency, fromMinorUnits } from '@/lib/currency';
import { CurrencyCode } from '@/lib/types';
import { Table, BarChart2 } from 'lucide-react';

interface CashFlowChartProps {
  data: { date: string; incomeMinor: number; expenseMinor: number }[];
  currency: CurrencyCode;
}

export function CashFlowChart({ data, currency }: CashFlowChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Format data for chart display (showing days like "Oct 12")
  const chartData = data.map((d) => {
    const parts = d.date.split('-');
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      date: label,
      fullDate: d.date,
      Income: fromMinorUnits(d.incomeMinor, currency),
      Expense: fromMinorUnits(d.expenseMinor, currency),
      incomeMinor: d.incomeMinor,
      expenseMinor: d.expenseMinor,
    };
  });

  const hasData = data.some((d) => d.incomeMinor > 0 || d.expenseMinor > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Cash Flow Velocity</CardTitle>
          <CardDescription>Income versus expenses pacing over this period</CardDescription>
        </div>
        <button
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label={showTable ? 'Switch to chart view' : 'Switch to accessible data table view'}
        >
          {showTable ? (
            <>
              <BarChart2 className="h-3.5 w-3.5" /> Chart View
            </>
          ) : (
            <>
              <Table className="h-3.5 w-3.5" /> Accessible Table
            </>
          )}
        </button>
      </CardHeader>

      <CardContent className="pt-2 flex-1 min-h-[260px]">
        {!hasData ? (
          <div className="flex h-52 flex-col items-center justify-center text-center text-slate-400">
            <p className="text-sm">No transaction activity recorded for this period yet.</p>
          </div>
        ) : showTable ? (
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-3 font-semibold">Date</th>
                  <th className="py-2 px-3 font-semibold">Income</th>
                  <th className="py-2 px-3 font-semibold">Expense</th>
                  <th className="py-2 px-3 font-semibold">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data
                  .filter((d) => d.incomeMinor > 0 || d.expenseMinor > 0)
                  .map((row) => (
                    <tr key={row.date}>
                      <td className="py-2 px-3 font-medium">{row.date}</td>
                      <td className="py-2 px-3 text-emerald-600">
                        {formatCurrency(row.incomeMinor, currency)}
                      </td>
                      <td className="py-2 px-3 text-rose-600">
                        {formatCurrency(row.expenseMinor, currency)}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {formatCurrency(row.incomeMinor - row.expenseMinor, currency)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`${currency} ${Number(value).toLocaleString()}`, '']}
                  labelStyle={{ fontWeight: 'bold' }}
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
