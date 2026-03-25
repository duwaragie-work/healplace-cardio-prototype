'use client';

import type { ReactNode } from 'react';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-background)' }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
