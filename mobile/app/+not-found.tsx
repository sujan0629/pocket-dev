import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/StateView';

export default function NotFoundScreen() {
  return (
    <Screen contentClassName="items-center justify-center px-5">
      <EmptyState
        icon="map-outline"
        title="Page Not Found"
        description="This route doesn’t exist or may have moved."
      />
      <Link href="/" asChild>
        <Pressable className="rounded-full bg-[#0091FF] px-6 py-3 active:opacity-80 active:scale-[0.98]">
          <AppText className="text-sm font-semibold text-white">Go Home</AppText>
        </Pressable>
      </Link>
    </Screen>
  );
}
