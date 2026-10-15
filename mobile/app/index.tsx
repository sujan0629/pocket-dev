import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function Index() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (!isBootstrapping) {
    return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl border border-[#0091FF]/25 bg-[#0091FF]/15">
        <Ionicons name="terminal" size={30} color={colors.primary} />
      </View>
      <AppText variant="title">PocketDev</AppText>
      <ActivityIndicator className="mt-5" size="small" color={colors.primary} />
    </View>
  );
}
