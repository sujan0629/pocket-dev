import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;

  return (
    <View className="flex-row items-center justify-center gap-2 border-b border-white/[0.08] bg-[#1C1C1E] px-4 py-2">
      <Ionicons name="cloud-offline" size={15} color="#FF9F0A" />
      <AppText className="text-[12px] font-medium text-[#FF9F0A]">
        Offline — showing cached data
      </AppText>
    </View>
  );
}
