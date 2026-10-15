import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';
import { cn } from '@/utils/cn';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  className?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  onPress,
  right,
  danger = false,
  className,
}: ListRowProps) {
  const content = (
    <>
      {icon ? (
        <View
          className={cn(
            'h-8 w-8 items-center justify-center rounded-[8px]',
            danger ? 'bg-[#FF453A]/15' : 'bg-[#0091FF]/15',
          )}
        >
          <Ionicons
            name={icon}
            size={18}
            color={danger ? colors.danger : colors.primary}
          />
        </View>
      ) : null}
      <View className="min-w-0 flex-1">
        <AppText
          className={cn(
            'text-[16px] font-normal tracking-[-0.2px] text-white',
            danger && 'text-[#FF453A]',
          )}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" className="mt-0.5 text-xs text-[rgba(235,235,245,0.60)]" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <Ionicons
            name="chevron-forward"
            size={17}
            color="rgba(235, 235, 245, 0.30)"
          />
        ) : null)}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className={cn(
          'flex-row items-center gap-3.5 px-4 py-3 min-h-[48px] active:bg-white/[0.06]',
          className,
        )}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className={cn('flex-row items-center gap-3.5 px-4 py-3 min-h-[48px]', className)}>
      {content}
    </View>
  );
}
