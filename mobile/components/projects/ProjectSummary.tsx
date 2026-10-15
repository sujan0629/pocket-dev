import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { DesktopStatus, Project } from '@/types/api';
import { formatRelativeDate } from '@/utils/format';

export function ProjectSummary({
  project,
  desktop,
}: {
  project: Project;
  desktop?: DesktopStatus;
}) {
  const desktopReady = Boolean(
    desktop?.online &&
    desktop.tunnelUrl &&
    (desktop.projects?.some((link) => link.projectId === project.id) ||
      desktop.projectId === project.id),
  );

  return (
    <Card className="gap-3.5">
      <View className="flex-row items-center gap-3.5">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#0091FF]/15 border border-[#0091FF]/20">
          <Ionicons name="code-slash" size={22} color={colors.primary} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="heading" numberOfLines={1}>
            {project.name}
          </AppText>
          <AppText variant="mono" className="mt-0.5 text-xs text-[rgba(235,235,245,0.45)]">
            {project.slug}
          </AppText>
        </View>
        <Badge
          label={desktopReady ? 'Desktop' : 'Cloud'}
          tone={desktopReady ? 'success' : 'info'}
          dot
        />
      </View>

      {project.description ? (
        <AppText variant="caption" className="text-sm leading-5 text-[rgba(235,235,245,0.70)]">
          {project.description}
        </AppText>
      ) : null}

      {project.desktopPath ? (
        <View className="rounded-xl bg-[#2C2C2E] px-3.5 py-2.5 border border-white/[0.06]">
          <AppText variant="label" className="text-[11px] text-[rgba(235,235,245,0.45)]">Linked desktop folder</AppText>
          <AppText variant="mono" className="mt-1 text-xs text-[#64D2FF]" numberOfLines={2}>
            {project.desktopPath}
          </AppText>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between border-t border-white/[0.06] pt-3">
        <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.50)]">
          {desktopReady ? 'Workspace access' : 'Last synced'}
        </AppText>
        <AppText className="text-xs font-medium text-[rgba(235,235,245,0.85)]">
          {desktopReady ? 'Live from desktop' : formatRelativeDate(project.lastSyncedAt)}
        </AppText>
      </View>
    </Card>
  );
}
