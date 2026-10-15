import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { cn } from '@/utils/cn';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const container: Record<BadgeTone, string> = {
  neutral: 'border-white/[0.08] bg-[#2C2C2E]',
  primary: 'border-[#0091FF]/30 bg-[#0091FF]/12',
  success: 'border-[#30D158]/30 bg-[#30D158]/12',
  warning: 'border-[#FF9F0A]/30 bg-[#FF9F0A]/12',
  danger: 'border-[#FF453A]/30 bg-[#FF453A]/12',
  info: 'border-[#64D2FF]/30 bg-[#64D2FF]/12',
};

const text: Record<BadgeTone, string> = {
  neutral: 'text-[rgba(235,235,245,0.70)]',
  primary: 'text-[#0091FF]',
  success: 'text-[#30D158]',
  warning: 'text-[#FF9F0A]',
  danger: 'text-[#FF453A]',
  info: 'text-[#64D2FF]',
};

const dotColors: Record<BadgeTone, string> = {
  neutral: 'bg-[rgba(235,235,245,0.60)]',
  primary: 'bg-[#0091FF]',
  success: 'bg-[#30D158]',
  warning: 'bg-[#FF9F0A]',
  danger: 'bg-[#FF453A]',
  info: 'bg-[#64D2FF]',
};

export function Badge({
  label,
  tone = 'neutral',
  dot = false,
}: {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  return (
    <View
      className={cn(
        'self-start flex-row items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        container[tone],
      )}
    >
      {dot ? (
        <View className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} />
      ) : null}
      <AppText className={cn('text-[11px] font-semibold tracking-[-0.1px]', text[tone])}>{label}</AppText>
    </View>
  );
}
