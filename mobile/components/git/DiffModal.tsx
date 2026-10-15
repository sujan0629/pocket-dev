import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/StateView';

function lineClass(line: string): string {
  if (line.startsWith('+') && !line.startsWith('+++')) return 'text-[#30D158]';
  if (line.startsWith('-') && !line.startsWith('---')) return 'text-[#FF453A]';
  if (line.startsWith('@@')) return 'text-[#64D2FF]';
  return 'text-[rgba(235,235,245,0.60)]';
}

export function DiffModal({
  visible,
  path,
  diff,
  loading,
  onClose,
}: {
  visible: boolean;
  path?: string;
  diff?: string;
  loading: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <AppHeader
          title={path ? path.split('/').pop() || path : 'Working Tree Diff'}
          subtitle={path ? path : 'Unstaged changes'}
          right={<Button label="Done" size="sm" variant="ghost" onPress={onClose} />}
        />

        {loading ? (
          <LoadingState label="Generating diff…" />
        ) : diff ? (
          <ScrollView
            className="flex-1 bg-black"
            contentContainerClassName="p-4"
            horizontal
            showsHorizontalScrollIndicator
          >
            <View>
              {diff.split('\n').map((line, index) => (
                <AppText
                  key={`${index}-${line.slice(0, 20)}`}
                  variant="mono"
                  className={`text-[12px] leading-5 ${lineClass(line)}`}
                >
                  {line || ' '}
                </AppText>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <AppText variant="heading" className="text-white">No Unstaged Diff</AppText>
            <AppText variant="caption" className="mt-2 text-center text-sm text-[rgba(235,235,245,0.60)]">
              This file may only contain staged changes, or it has no changes.
            </AppText>
          </View>
        )}

        <View
          className="border-t border-white/[0.08] bg-[#1C1C1E] px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button label="Close" variant="secondary" fullWidth onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
