'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ListItemSkeletonProps = {
  avatarSize?: 'sm' | 'md';
  lines?: 1 | 2;
  className?: string;
};

const avatarSizes = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
} as const;

export function ListItemSkeleton({
  avatarSize = 'md',
  lines = 2,
  className,
}: ListItemSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      <Skeleton
        className={cn('shrink-0 rounded-full', avatarSizes[avatarSize])}
      />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        {lines >= 2 && <Skeleton className="h-3 w-1/4" />}
      </div>
    </div>
  );
}
