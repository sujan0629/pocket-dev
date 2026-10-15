import { Ionicons } from '@expo/vector-icons';
import type { GitFileStatus } from '@pocketdev/shared';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { colors } from '@/constants/theme';

export function GitFileRow({ file, onPress }: { file: GitFileStatus; onPress: () => void }) {
  const isDeleted = file.status.includes('D');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[46px] flex-row items-center gap-3 border-b border-white/[0.06] px-4 py-3 active:bg-white/[0.06]"
    >
      <Ionicons
        name={isDeleted ? 'trash-outline' : 'document-text-outline'}
        size={18}
        color={isDeleted ? colors.danger : colors.muted}
      />
      <AppText variant="mono" className="min-w-0 flex-1 text-[13px] text-white/95" numberOfLines={1}>
        {file.path}
      </AppText>
      {file.staged ? <Badge label="staged" tone="success" /> : null}
      <AppText variant="mono" className="text-xs font-semibold text-[#FF9F0A]">
        {file.status}
      </AppText>
    </Pressable>
  );
}
