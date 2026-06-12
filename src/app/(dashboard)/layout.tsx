import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-16 md:pb-0">
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-6xl mx-auto">
          {children}
        </main>
      </div>

      {/* BottomNav - Mobile */}
      <BottomNav />
    </div>
  );
}
