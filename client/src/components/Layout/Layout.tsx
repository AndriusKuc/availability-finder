import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  centered?: boolean;
}

export function Layout({ children, centered = true }: LayoutProps) {
  return (
    <div
      className={`max-w-6xl mx-auto px-4 py-8 min-h-screen flex flex-col items-center ${
        centered ? 'justify-center' : ''
      }`}
    >
      {children}
    </div>
  );
}
