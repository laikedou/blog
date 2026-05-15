import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('animate-pulse rounded-editorial-sm bg-cream-300', className)} {...props} />
  );
}

export { Skeleton };
