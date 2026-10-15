import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';

interface SettingsSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <View>
      <AppText variant="label" className="mb-2 px-2 text-[12px]">
        {title}
      </AppText>
      <Card className="overflow-hidden p-0 border border-white/[0.08] bg-[#1C1C1E]">{children}</Card>
      {description ? (
        <AppText variant="caption" className="mt-2 px-2 text-xs leading-4.5 text-[rgba(235,235,245,0.50)]">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
