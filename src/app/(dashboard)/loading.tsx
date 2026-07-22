import React from 'react';
import { TreeLoading } from '@/components/ui/TreeLoading';

export default function DashboardLoading() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center min-h-[300px] animate-fade-in">
      <TreeLoading label="Cultivando o jardim..." size="lg" />
    </div>
  );
}
