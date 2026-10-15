import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import {
  getLocalModel,
  importLocalModel,
  type LocalModel,
  removeLocalModel,
} from '@/services/localAssistant';
import { getErrorMessage } from '@/utils/errors';
import { formatBytes } from '@/utils/format';

export default function AssistantSettingsScreen() {
  const [model, setModel] = useState<LocalModel | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => setModel(await getLocalModel()), []);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const importModel = async () => {
    setLoading(true);
    try {
      const selected = await importLocalModel();
      if (selected) {
        setModel(selected);
        Toast.show({ type: 'success', text1: 'Local Model Ready', text2: selected.name });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Import Failed', text2: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const confirmRemove = () =>
    Alert.alert('Remove Local Model?', 'The copied GGUF file will be deleted from PocketDev.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await removeLocalModel();
            setModel(null);
          })();
        },
      },
    ]);

  return (
    <Screen>
      <AppHeader title="Local Assistant" subtitle="Offline error explanations" back />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-24 pt-4"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
      >
        <Card className="border border-white/[0.08] bg-[#1C1C1E] p-4.5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText variant="heading" className="text-[17px]">On-Device Model</AppText>
              <AppText variant="caption" className="mt-1 leading-5 text-xs text-[rgba(235,235,245,0.60)]">
                Powered by llama.cpp through Metal on supported Apple Silicon devices.
              </AppText>
            </View>
            <Badge
              label={model ? 'Installed' : 'Not Configured'}
              tone={model ? 'success' : 'warning'}
              dot
            />
          </View>
          {model ? (
            <View className="mt-4 rounded-xl border border-white/[0.06] bg-[#2C2C2E] p-3.5">
              <AppText variant="mono" className="text-xs text-[#64D2FF]" numberOfLines={2}>
                {model.name}
              </AppText>
              <AppText variant="caption" className="mt-1 text-[11px] text-[rgba(235,235,245,0.45)]">
                {formatBytes(model.size)}
              </AppText>
            </View>
          ) : null}
        </Card>

        <Card className="border border-white/[0.08] bg-[#1C1C1E] p-4.5">
          <AppText variant="heading" className="text-[17px]">Choosing a Model</AppText>
          <AppText variant="caption" className="mt-1.5 text-xs leading-5 text-[rgba(235,235,245,0.65)]">
            Use a small instruct model in GGUF format. A Q4_K_M quantization around 1–2 GB is a
            practical starting point. Larger models need substantially more device memory.
          </AppText>
        </Card>

        <Button
          label={model ? 'Replace GGUF Model' : 'Import GGUF Model'}
          icon="folder-open-outline"
          size="lg"
          fullWidth
          loading={loading}
          onPress={() => void importModel()}
        />
        {model ? (
          <Button
            label="Remove Model"
            icon="trash-outline"
            variant="danger"
            fullWidth
            onPress={confirmRemove}
          />
        ) : null}
        <AppText variant="caption" className="text-center text-xs text-[rgba(235,235,245,0.45)] leading-4.5">
          Model files stay privately on this device. Terminal output is never sent to external AI servers when using local models.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
