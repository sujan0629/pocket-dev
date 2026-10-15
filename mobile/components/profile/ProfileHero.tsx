import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { User } from '@/types/api';
import { initials } from '@/utils/format';

function getMemberSince(value?: string): string {
  if (!value) return 'PocketDev member';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'PocketDev member';

  return `Member since ${date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })}`;
}

export function ProfileHero({ user, tier }: { user: User; tier: User['tier'] }) {
  const isPaid = tier === 'PAID';
  const displayName = user.name?.trim() || 'PocketDev Developer';

  return (
    <Card className="border border-white/[0.08] bg-[#1C1C1E] p-4.5">
      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-[#0091FF]/30 bg-[#0091FF]/15">
          <AppText className="text-xl font-bold tracking-tight text-[#0091FF]">
            {initials(user.name, user.email) || 'PD'}
          </AppText>
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="heading" className="text-[19px]" numberOfLines={1}>
            {displayName}
          </AppText>
          <AppText variant="caption" className="mt-0.5 text-xs text-[rgba(235,235,245,0.60)]" numberOfLines={1}>
            {user.email}
          </AppText>
          <View className="mt-2">
            <Badge
              label={isPaid ? 'Paid Workspace' : 'Free Workspace'}
              tone={isPaid ? 'primary' : 'neutral'}
            />
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-3.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={14} color="rgba(235, 235, 245, 0.45)" />
          <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.50)]">{getMemberSince(user.createdAt)}</AppText>
        </View>
        <AppText variant="mono" className="max-w-32 text-right text-xs text-[rgba(235,235,245,0.40)]" numberOfLines={1}>
          {user.id}
        </AppText>
      </View>
    </Card>
  );
}
