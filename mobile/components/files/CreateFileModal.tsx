import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function CreateFileModal({
  visible,
  loading,
  onClose,
  onCreate,
}: {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (path: string) => void;
}) {
  const [path, setPath] = useState('');
  const insets = useSafeAreaInsets();
  const normalized = path.trim().replace(/^\/+/, '').replace(/\\/g, '/');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/65">
          <Pressable className="flex-1" onPress={onClose} />
          <View
            className="rounded-t-[28px] border-t border-white/[0.12] bg-[#1C1C1E] px-5 pt-3 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            {/* Apple Sheet Grabber */}
            <View className="items-center pb-3">
              <View className="h-1 w-9 rounded-full bg-white/20" />
            </View>

            <AppText variant="title">New File</AppText>
            <AppText variant="caption" className="mt-1 text-xs text-[rgba(235,235,245,0.60)]">
              Include folders in the path if needed (e.g. src/index.ts).
            </AppText>

            <Input
              label="Project-Relative Path"
              placeholder="src/components/Button.tsx"
              value={path}
              onChangeText={setPath}
              autoCapitalize="none"
              autoCorrect={false}
              className="font-mono"
              containerClassName="mt-5"
              autoFocus
            />

            <View className="mt-6 flex-row gap-3">
              <Button label="Cancel" variant="secondary" className="flex-1" onPress={onClose} />
              <Button
                label="Create"
                className="flex-1"
                loading={loading}
                disabled={!normalized}
                onPress={() => onCreate(normalized)}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
