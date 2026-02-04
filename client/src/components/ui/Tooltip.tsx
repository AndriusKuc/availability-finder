import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

export function Tooltip({ content, children, disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Check if tooltip would go above viewport
      if (triggerRect.top - tooltipRect.height - 8 < 0) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [isVisible]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`
            absolute z-[100] px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg
            whitespace-nowrap max-w-xs
            ${position === 'top'
              ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
              : 'top-full left-1/2 -translate-x-1/2 mt-2'
            }
            animate-fadeIn
          `}
        >
          {content}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${position === 'top'
                ? 'top-full border-t-gray-900'
                : 'bottom-full border-b-gray-900'
              }
            `}
          />
        </div>
      )}
    </div>
  );
}
