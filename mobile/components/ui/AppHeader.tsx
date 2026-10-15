import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, back = false, onBack, right }: AppHeaderProps) {
  return (
    <View className="min-h-[50px] flex-row items-center gap-3 border-b border-white/[0.08] bg-black px-4 py-2.5">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={onBack ?? (() => router.back())}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#1C1C1E] active:opacity-60"
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>
      ) : null}
      <View className="min-w-0 flex-1 justify-center">
        <AppText className="text-[17px] font-semibold tracking-[-0.2px] text-white" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" className="mt-0.5 text-[11px] text-[rgba(235,235,245,0.55)]" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  );
}
