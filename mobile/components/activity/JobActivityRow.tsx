import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { Job, Project, Session } from '@/types/api';
import { formatRelativeDate } from '@/utils/format';

type BadgeTone = ComponentProps<typeof Badge>['tone'];
type IconName = ComponentProps<typeof Ionicons>['name'];

const STATUS_DISPLAY: Record<Job['status'], { label: string; tone: BadgeTone; icon: IconName }> = {
  QUEUED: { label: 'Queued', tone: 'warning', icon: 'time-outline' },
  RUNNING: { label: 'Running', tone: 'primary', icon: 'pulse' },
  SUCCEEDED: {
    label: 'Succeeded',
    tone: 'success',
    icon: 'checkmark-circle-outline',
  },
  FAILED: { label: 'Failed', tone: 'danger', icon: 'close-circle-outline' },
  CANCELED: {
    label: 'Canceled',
    tone: 'neutral',
    icon: 'remove-circle-outline',
  },
};

export function JobActivityRow({
  job,
  project,
  session,
}: {
  job: Job;
  project?: Project;
  session?: Session;
}) {
  const status = STATUS_DISPLAY[job.status];
  const successfulExit = job.exitCode === 0;
  const date = job.finishedAt ?? job.startedAt ?? job.createdAt;

  return (
    <Card className="gap-3.5 border border-white/[0.08] bg-[#1C1C1E]">
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#2C2C2E] border border-white/[0.08]">
          <Ionicons
            name={status.icon}
            size={18}
            color={
              job.status === 'SUCCEEDED'
                ? colors.success
                : job.status === 'FAILED'
                  ? colors.danger
                  : job.status === 'RUNNING'
                    ? colors.primary
                    : job.status === 'QUEUED'
                      ? colors.warning
                      : colors.muted
            }
          />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="mono" className="font-semibold text-white text-[13px]" numberOfLines={2}>
            $ {job.command}
          </AppText>
          <View className="mt-1 flex-row items-center gap-1.5">
            <Ionicons name="folder-outline" size={13} color="rgba(235, 235, 245, 0.45)" />
            <AppText variant="caption" className="min-w-0 flex-1 text-[11px] text-[rgba(235,235,245,0.60)]" numberOfLines={1}>
              {project?.name ?? `Project ${job.projectId.slice(0, 8)}`}
            </AppText>
          </View>
        </View>
        <Badge label={status.label} tone={status.tone} dot />
      </View>

      <View className="flex-row flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-white/[0.06] pt-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name={job.target === 'DESKTOP' ? 'desktop-outline' : 'cloud-outline'}
            size={13}
            color="rgba(235, 235, 245, 0.50)"
          />
          <AppText className="text-xs text-[rgba(235,235,245,0.65)] font-medium">
            {job.target === 'DESKTOP' ? 'Desktop' : 'Cloud'}
          </AppText>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Ionicons name="code-working-outline" size={13} color="rgba(235, 235, 245, 0.50)" />
          <AppText
            className={
              job.exitCode === null
                ? 'text-xs text-[rgba(235,235,245,0.45)]'
                : successfulExit
                  ? 'text-xs font-semibold text-[#30D158]'
                  : 'text-xs font-semibold text-[#FF453A]'
            }
          >
            Exit {job.exitCode ?? 'pending'}
          </AppText>
        </View>

        {session?.status === 'ACTIVE' ? (
          <View className="flex-row items-center gap-1.5">
            <View className="h-1.5 w-1.5 rounded-full bg-[#0091FF]" />
            <AppText className="text-xs font-semibold text-[#0091FF]">Live</AppText>
          </View>
        ) : null}

        <View className="ml-auto flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={12} color="rgba(235, 235, 245, 0.40)" />
          <AppText className="text-xs text-[rgba(235,235,245,0.45)]">{formatRelativeDate(date)}</AppText>
        </View>
      </View>
    </Card>
  );
}
