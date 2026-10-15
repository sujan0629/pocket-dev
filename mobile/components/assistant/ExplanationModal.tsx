import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { assistantApi } from '@/api/pocketdev';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import {
  explainTerminalFailure as explainLocally,
  getLocalModel,
  releaseLocalAssistant,
} from '@/services/localAssistant';
import { getErrorMessage } from '@/utils/errors';
import { plainTerminalText } from '@/utils/terminal';

export function ExplanationModal({
  visible,
  command,
  output,
  exitCode,
  onClose,
}: {
  visible: boolean;
  command: string;
  output: string;
  exitCode?: number;
  onClose: () => void;
}) {
  const [explanation, setExplanation] = useState('');
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    let active = true;

    void (async () => {
      try {
        const localModel = await getLocalModel();
        if (localModel) {
          try {
            if (!active) return;
            setSource(`On-device · ${localModel.name}`);
            const result = await explainLocally({
              command,
              output,
              exitCode,
              onToken: (token) => {
                if (active) setExplanation((current) => current + token);
              },
            });
            if (active) setExplanation((current) => current || result);
            return;
          } catch {
            if (active) {
              setExplanation('');
              setSource(null);
            }
          }
        }

        const result = await assistantApi.explainTerminalFailure({
          command,
          output: plainTerminalText(output).slice(-12_000),
          exitCode,
        });
        if (!active) return;
        setExplanation(result.explanation);
        setSource(`PocketDev server · ${result.model}`);
      } catch (assistantError) {
        if (active) {
          setError(
            getErrorMessage(
              assistantError,
              'The AI assistant could not explain this terminal output.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      void releaseLocalAssistant();
    };
  }, [command, exitCode, output, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <AppHeader
          title="AI Explanation"
          subtitle={source ?? 'Analyzing terminal output'}
          right={<Button label="Done" size="sm" variant="ghost" onPress={onClose} />}
        />

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4">
          {loading && !explanation ? (
            <View className="items-center gap-3 py-16">
              <ActivityIndicator color={colors.primary} />
              <AppText variant="caption" className="text-sm text-[rgba(235,235,245,0.60)]">
                Analyzing terminal output…
              </AppText>
            </View>
          ) : null}
          {error ? (
            <View className="flex-row items-start gap-2.5 rounded-xl border border-white/[0.08] bg-[#1C1C1E] p-4">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <AppText className="flex-1 text-xs text-[#FF453A] leading-5">{error}</AppText>
            </View>
          ) : null}
          {explanation ? (
            <View className="rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-4.5">
              <AppText selectable className="text-[15px] leading-6 text-white/90">
                {explanation}
              </AppText>
            </View>
          ) : null}
          {loading && explanation ? (
            <ActivityIndicator className="mt-4 self-start" size="small" color={colors.primary} />
          ) : null}
        </ScrollView>

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
