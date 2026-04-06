'use client';

import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';

type LogoProps = {
  size?: LogoSize;
  className?: string;
  showText?: boolean;
  textClassName?: string;
};

const sizeConfig: Record<LogoSize, { icon: string; text: string }> = {
  sm: { icon: 'h-6 w-6', text: 'text-sm' },
  md: { icon: 'h-8 w-8', text: 'text-lg' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl' },
};

export function Logo({
  size = 'md',
  className,
  showText = true,
  textClassName,
}: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
          config.icon
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[60%] w-[60%]"
        >
          <path d="M12 2v20M2 12h20" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-semibold', config.text, textClassName ?? 'text-foreground')}>
            Clínica San Miguel
          </span>
        </div>
      )}
    </div>
  );
}
