import React from 'react';
import TendersHeader from './TendersHeader';

export default function TendersLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <TendersHeader />
      {children}
    </div>
  );
} 