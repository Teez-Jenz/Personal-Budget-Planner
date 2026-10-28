import type { Metadata } from 'next';
import { LayoutWrapper } from '@/components/layout-wrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'PocketWise — Student Budget Planner',
  description:
    'A simple, fun budget planner for secondary school students to calculate incomes, track expenses, save in their piggy bank, and spend money based on plans.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
