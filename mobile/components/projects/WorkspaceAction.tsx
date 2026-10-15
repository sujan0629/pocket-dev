import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function WorkspaceAction({
  icon,
  title,
  description,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-4 active:bg-[#2C2C2E]/75 active:scale-[0.98]"
    >
      <View className="mb-3.5 h-11 w-11 items-center justify-center rounded-xl bg-[#0091FF]/15 border border-[#0091FF]/20">
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <AppText className="text-[17px] font-semibold tracking-[-0.2px] text-white">{title}</AppText>
      <AppText variant="caption" className="mt-0.5 text-xs text-[rgba(235,235,245,0.60)] leading-4">
        {description}
      </AppText>
    </Pressable>
  );
}
