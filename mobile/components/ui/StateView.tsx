import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <ActivityIndicator size="small" color={colors.primary} />
      <AppText variant="caption" className="text-sm text-[rgba(235,235,245,0.60)]">
        {label}
      </AppText>
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#1C1C1E] border border-white/[0.08]">
        <Ionicons name={icon} size={30} color={colors.muted} />
      </View>
      <AppText variant="heading" className="text-center font-semibold text-white">
        {title}
      </AppText>
      <AppText
        variant="caption"
        className="mt-1.5 max-w-[280px] text-center text-sm leading-5 text-[rgba(235,235,245,0.60)]"
      >
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="secondary"
          size="sm"
          onPress={onAction}
          className="mt-6"
        />
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="warning-outline"
      title="Unable to Load"
      description={message}
      actionLabel={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
    />
  );
}
