import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'card-sm',
  md: 'card-md',
  lg: 'card-lg',
};

export function Card({ children, className = '', size = 'sm' }: CardProps) {
  return (
    <div className={`card ${sizeClasses[size]} ${className}`}>{children}</div>
  );
}
