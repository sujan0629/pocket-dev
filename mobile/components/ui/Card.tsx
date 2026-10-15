import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/utils/cn';

interface CardProps extends PropsWithChildren<ViewProps> {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-4 shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
