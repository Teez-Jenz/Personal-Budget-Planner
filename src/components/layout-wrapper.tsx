'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { BudgetPlannerProvider } from '@/lib/store';
import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';
import { MobileNav } from '@/components/navigation/mobile-nav';

function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <BudgetPlannerProvider>
      <div className="flex min-h-screen bg-slate-50/50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col pb-16 md:pb-0 overflow-x-hidden">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {mounted ? (
              children
            ) : (
              <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
              </div>
            )}
          </main>
          <MobileNav />
        </div>
      </div>
    </BudgetPlannerProvider>
  );
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
