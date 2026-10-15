import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { Subscription, User } from '@/types/api';

function formatReset(value?: string): string {
  if (!value) return 'Reset time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Reset time unavailable';

  return `Resets ${date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

interface PlanCardProps {
  tier: User['tier'];
  subscription?: Subscription | null;
  loading?: boolean;
  actionDisabled?: boolean;
  error?: string;
  onChangePlan: () => void;
}

export function PlanCard({
  tier,
  subscription,
  loading = false,
  actionDisabled = false,
  error,
  onChangePlan,
}: PlanCardProps) {
  const effectiveTier = subscription?.tier ?? tier;
  const isPaid = effectiveTier === 'PAID';
  const used = subscription?.jobsUsedToday;
  const limit = subscription?.quotaJobsPerDay;
  const hasQuota = typeof used === 'number' && typeof limit === 'number';
  const progress = hasQuota && limit > 0 ? Math.max(0, Math.min(100, (used / limit) * 100)) : 0;
  const remaining = hasQuota ? Math.max(0, limit - used) : null;

  return (
    <Card className="gap-4 border border-white/[0.08] bg-[#1C1C1E]">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <AppText variant="label">Plan & Quota</AppText>
          <AppText variant="heading" className="mt-0.5">
            {isPaid ? 'PocketDev Paid' : 'PocketDev Free'}
          </AppText>
        </View>
        <Badge
          label={subscription?.status || (isPaid ? 'Paid' : 'Free')}
          tone={isPaid ? 'primary' : 'neutral'}
        />
      </View>

      <View className="rounded-xl border border-white/[0.06] bg-[#2C2C2E] p-4">
        <View className="flex-row items-end justify-between gap-3">
          <View>
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.60)]">Cloud Jobs Today</AppText>
            <AppText className="mt-1 text-[20px] font-bold text-white">
              {hasQuota ? used : '—'}
              <AppText className="text-sm font-normal text-[rgba(235,235,245,0.45)]">
                {hasQuota ? ` / ${limit}` : ''}
              </AppText>
            </AppText>
          </View>
          <AppText variant="caption" className="text-right text-xs text-[rgba(235,235,245,0.60)]">
            {remaining === null ? 'Quota unavailable' : `${remaining} remaining`}
          </AppText>
        </View>
        <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <View className="h-full rounded-full bg-[#0091FF]" style={{ width: `${progress}%` }} />
        </View>
        <AppText variant="caption" className="mt-2 text-[11px] text-[rgba(235,235,245,0.45)]">
          {formatReset(subscription?.quotaResetAt)}
        </AppText>
      </View>

      {error && !subscription ? (
        <View className="flex-row items-start gap-2.5 rounded-xl border border-white/[0.08] bg-[#2C2C2E] p-3">
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <AppText variant="caption" className="min-w-0 flex-1 text-xs text-[#FF453A]">
            {error}
          </AppText>
        </View>
      ) : null}

      <View className="flex-row items-start gap-2.5 rounded-xl border border-white/[0.08] bg-[#2C2C2E] p-3">
        <Ionicons name="information-circle" size={16} color={colors.warning} />
        <AppText variant="caption" className="min-w-0 flex-1 text-xs leading-4.5 text-[rgba(235,235,245,0.75)]">
          Demo tier changes apply immediately. Paid jobs receive priority in the shared queue; Free
          jobs use standard priority.
        </AppText>
      </View>

      <Button
        label={isPaid ? 'Switch to Free demo' : 'Try Paid demo'}
        icon={isPaid ? 'arrow-down-circle-outline' : 'sparkles-outline'}
        variant={isPaid ? 'secondary' : 'primary'}
        fullWidth
        loading={loading}
        disabled={actionDisabled}
        onPress={onChangePlan}
      />
    </Card>
  );
}
