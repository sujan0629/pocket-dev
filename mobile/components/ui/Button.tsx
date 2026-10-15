import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';
import { cn } from '@/utils/cn';

type IconName = ComponentProps<typeof Ionicons>['name'];
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const containerVariants: Record<ButtonVariant, string> = {
  // Apple Prominent Fill: System tint background with crisp white label
  primary: 'bg-[#0091FF] active:bg-[#0077ED]',
  // Apple Gray Fill: systemGray5 background with tint or white label
  secondary: 'bg-[#2C2C2E] border border-white/[0.08] active:bg-[#3A3A3C]',
  // Apple Plain: borderless interactive element
  ghost: 'bg-transparent active:bg-white/[0.06]',
  // Apple Destructive: translucent red or solid red
  danger: 'bg-[#FF453A]/15 border border-[#FF453A]/30 active:bg-[#FF453A]/25',
};

const textVariants: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white/90',
  ghost: 'text-[#0091FF]',
  danger: 'text-[#FF453A]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-[34px] px-3.5 py-1.5 rounded-full',
  md: 'min-h-[44px] px-5 py-2.5 rounded-full',
  lg: 'min-h-[48px] px-6 py-3 rounded-2xl',
};

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 active:opacity-80 active:scale-[0.98]',
        containerVariants[variant],
        sizes[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-40',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? colors.danger : colors.primary}
            />
          ) : null}
          <AppText
            className={cn('text-sm font-semibold tracking-[-0.2px]', textVariants[variant])}
            numberOfLines={1}
          >
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

interface IconButtonProps extends PressableProps {
  icon: IconName;
  label: string;
  danger?: boolean;
  size?: number;
}

export function IconButton({
  icon,
  label,
  danger = false,
  size = 20,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      className={cn(
        'h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] active:opacity-70 active:scale-[0.96]',
        danger ? 'bg-[#FF453A]/15 border-[#FF453A]/30' : 'bg-[#1C1C1E]',
        className,
      )}
      {...props}
    >
      <Ionicons name={icon} size={size} color={danger ? colors.danger : colors.text} />
    </Pressable>
  );
}

export function ButtonGroup({ children }: { children: React.ReactNode }) {
  return <View className="flex-row items-center gap-2.5">{children}</View>;
}
