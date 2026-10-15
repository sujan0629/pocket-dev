import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { filesApi } from '@/api/pocketdev';
import { CodeEditor } from '@/components/files/CodeEditor';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateView';
import { getErrorMessage } from '@/utils/errors';
import { formatBytes } from '@/utils/format';

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

type FileDocument = Awaited<ReturnType<typeof filesApi.read>>;

function EditorWorkspace({
  projectId,
  path,
  file,
}: {
  projectId: string;
  path: string;
  file: FileDocument;
}) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(file.content);
  const isDirty = draft !== file.content;
  const stats = useMemo(
    () => ({
      lines: draft ? draft.split('\n').length : 1,
      bytes: new TextEncoder().encode(draft).length,
    }),
    [draft],
  );

  const saveMutation = useMutation({
    mutationFn: () => filesApi.write(projectId, path, draft),
    onSuccess: async (result) => {
      queryClient.setQueryData(['file', projectId, path], {
        path,
        content: draft,
        encoding: 'utf-8',
        size: result.size,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['files', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['git', projectId] }),
      ]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Saved', text2: path });
    },
    onError: (error) =>
      Toast.show({ type: 'error', text1: 'Save failed', text2: getErrorMessage(error) }),
  });

  usePreventRemove(isDirty, ({ data }) => {
    Keyboard.dismiss();
    Alert.alert('Discard Unsaved Changes?', 'Your modifications have not been saved.', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const goBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  return (
    <Screen keyboard edges={['top', 'left', 'right', 'bottom']}>
      <AppHeader
        title={path.split('/').pop() || 'Editor'}
        subtitle={path}
        back
        onBack={goBack}
        right={
          <View className="flex-row items-center gap-2">
            <IconButton
              icon="copy-outline"
              label="Copy file"
              onPress={() => {
                void Clipboard.setStringAsync(draft);
                Toast.show({ type: 'info', text1: 'Copied to Clipboard' });
              }}
            />
            <IconButton
              icon={saveMutation.isPending ? 'hourglass-outline' : 'save-outline'}
              label="Save file"
              onPress={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending}
            />
          </View>
        }
      />

      <View className="flex-row items-center justify-between border-b border-white/[0.08] bg-[#1C1C1E] px-4 py-2">
        <AppText variant="mono" className={isDirty ? 'text-xs text-[#FF9F0A]' : 'text-xs text-[#30D158]'}>
          {isDirty ? '● Modified' : '✓ Saved'}
        </AppText>
        <AppText className="text-xs text-[rgba(235,235,245,0.50)]">
          {stats.lines} lines · {formatBytes(stats.bytes)}
        </AppText>
      </View>

      <CodeEditor value={draft} onChangeText={setDraft} />

      {/* iOS Keyboard Accessory Bar */}
      <View
        className="flex-row items-center gap-1.5 border-t border-white/[0.08] bg-[#1C1C1E] px-3 py-2"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        {['  ', '\t', '{', '}', '(', ')', '[', ']', ';'].map((key, index) => (
          <Pressable
            key={`${key}-${index}`}
            onPress={() => setDraft((value) => value + key)}
            className="h-8 min-w-[34px] items-center justify-center rounded-lg border border-white/[0.08] bg-[#2C2C2E] px-2 active:bg-[#3A3A3C]"
          >
            <AppText variant="mono" className="text-xs text-white/90">
              {key === '  ' ? '⇥' : key === '\t' ? 'Tab' : key}
            </AppText>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          className="ml-auto h-8 items-center justify-center rounded-lg bg-[#0091FF] px-3 active:bg-[#0077ED]"
        >
          <AppText className="text-xs font-semibold text-white">
            Done
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

export default function EditorScreen() {
  const params = useLocalSearchParams<{ projectId: string; path: string }>();
  const projectId = param(params.projectId);
  const path = param(params.path);
  const fileQuery = useQuery({
    queryKey: ['file', projectId, path],
    queryFn: () => filesApi.read(projectId, path),
    enabled: Boolean(projectId && path),
  });

  if (fileQuery.isLoading) {
    return (
      <Screen>
        <AppHeader title={path.split('/').pop() || 'Editor'} back />
        <LoadingState label="Opening file…" />
      </Screen>
    );
  }

  if (!fileQuery.data) {
    return (
      <Screen>
        <AppHeader title="Editor" back />
        <ErrorState
          message={getErrorMessage(fileQuery.error, 'Could not open this file.')}
          onRetry={() => void fileQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <EditorWorkspace
      key={`${projectId}:${path}`}
      projectId={projectId}
      path={path}
      file={fileQuery.data}
    />
  );
}
