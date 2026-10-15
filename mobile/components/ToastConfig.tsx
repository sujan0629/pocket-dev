import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import type { BaseToastProps } from 'react-native-toast-message';

import { colors } from '@/constants/theme';

/**
 * Apple Dynamic Island / HUD style toast configuration
 */
export const ToastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <View className="mx-5 flex-row items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#1C1C1E]/95 px-4 py-3 shadow-2xl">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-[#30D158]/20">
        <Ionicons name="checkmark" size={16} color={colors.success} />
      </View>
      <View className="min-w-0 flex-1">
        {text1 && <Text className="text-sm font-semibold tracking-[-0.2px] text-white">{text1}</Text>}
        {text2 && <Text className="mt-0.5 text-xs text-[rgba(235,235,245,0.60)]">{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }: BaseToastProps) => (
    <View className="mx-5 flex-row items-center gap-3 rounded-2xl border border-[#FF453A]/30 bg-[#1C1C1E]/95 px-4 py-3 shadow-2xl">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-[#FF453A]/20">
        <Ionicons name="close" size={16} color={colors.danger} />
      </View>
      <View className="min-w-0 flex-1">
        {text1 && <Text className="text-sm font-semibold tracking-[-0.2px] text-white">{text1}</Text>}
        {text2 && <Text className="mt-0.5 text-xs text-[#FF453A]">{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }: BaseToastProps) => (
    <View className="mx-5 flex-row items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#1C1C1E]/95 px-4 py-3 shadow-2xl">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-[#0091FF]/20">
        <Ionicons name="information" size={16} color={colors.primary} />
      </View>
      <View className="min-w-0 flex-1">
        {text1 && <Text className="text-sm font-semibold tracking-[-0.2px] text-white">{text1}</Text>}
        {text2 && <Text className="mt-0.5 text-xs text-[rgba(235,235,245,0.60)]">{text2}</Text>}
      </View>
    </View>
  ),
};
