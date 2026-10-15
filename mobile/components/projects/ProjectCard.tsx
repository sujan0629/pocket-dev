import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';
import type { Project } from '@/types/api';
import { formatRelativeDate } from '@/utils/format';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const activityLabel = project.lastSyncedAt
    ? `Synced ${formatRelativeDate(project.lastSyncedAt)}`
    : `Updated ${formatRelativeDate(project.updatedAt)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${project.name}`}
      accessibilityHint="Opens the project workspace"
      onPress={onPress}
      className="rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-4 active:bg-[#2C2C2E]/75 active:scale-[0.99]"
    >
      <View className="flex-row items-center gap-3.5">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#0091FF]/15 border border-[#0091FF]/20">
          <Ionicons name="folder" size={22} color={colors.primary} />
        </View>

        <View className="min-w-0 flex-1">
          <AppText variant="heading" numberOfLines={1}>
            {project.name}
          </AppText>
          <AppText variant="mono" className="mt-0.5 text-xs text-[rgba(235,235,245,0.45)]" numberOfLines={1}>
            {project.slug}
          </AppText>
        </View>

        <Ionicons name="chevron-forward" size={18} color="rgba(235, 235, 245, 0.30)" />
      </View>

      {project.description ? (
        <AppText variant="caption" className="mt-3 leading-5 text-[rgba(235,235,245,0.70)]" numberOfLines={2}>
          {project.description}
        </AppText>
      ) : null}

      <View className="mt-3.5 flex-row items-center border-t border-white/[0.06] pt-3">
        <Ionicons name="time-outline" size={14} color={colors.muted} />
        <AppText variant="caption" className="ml-1.5 text-xs text-[rgba(235,235,245,0.50)]">
          {activityLabel}
        </AppText>
        {project.desktopPath ? (
          <View className="ml-auto flex-row items-center gap-1">
            <Ionicons name="desktop-outline" size={13} color={colors.muted} />
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.50)]">
              Desktop
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
