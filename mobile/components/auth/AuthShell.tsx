import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';

interface AuthShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <Screen scroll keyboard contentClassName="flex-grow justify-center py-12 px-4">
      <View className="mb-8">
        <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1C1C1E]">
          <Ionicons name="terminal" size={26} color={colors.primary} />
        </View>
        <AppText variant="display">{title}</AppText>
        <AppText variant="body" className="mt-2 text-[15px] leading-5 text-[rgba(235,235,245,0.65)]">
          {subtitle}
        </AppText>
      </View>
      {children}
    </Screen>
  );
}
