import type { GitPushProgress } from '@pocketdev/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { gitApi, projectsApi } from '@/api/pocketdev';
import { DiffModal } from '@/components/git/DiffModal';
import { GitFileRow } from '@/components/git/GitFileRow';
import { GitTextModal } from '@/components/git/GitTextModal';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { colors } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/errors';
import { formatRelativeDate } from '@/utils/format';

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

const PUSH_POLL_INTERVAL_MS = 650;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function GitScreen() {
  const params = useLocalSearchParams<{ projectId: string }>();
  const projectId = param(params.projectId);
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'changes' | 'history'>('changes');
  const [commitVisible, setCommitVisible] = useState(false);
  const [remoteVisible, setRemoteVisible] = useState(false);
  const [diffPath, setDiffPath] = useState<string | undefined>();
  const [pushProgress, setPushProgress] = useState<GitPushProgress | null>(null);
  const [pushElapsedSeconds, setPushElapsedSeconds] = useState(0);

  const projectQuery = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId),
  });
  const statusQuery = useQuery({
    queryKey: ['git', projectId, 'status'],
    queryFn: () => gitApi.status(projectId),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const isRepository = Boolean(statusQuery.data);
  const logQuery = useQuery({
    queryKey: ['git', projectId, 'log'],
    queryFn: () => gitApi.log(projectId),
    enabled: isRepository,
  });
  const branchesQuery = useQuery({
    queryKey: ['git', projectId, 'branches'],
    queryFn: () => gitApi.branches(projectId),
    enabled: isRepository,
  });
  const diffQuery = useQuery({
    queryKey: ['git', projectId, 'diff', diffPath],
    queryFn: () => gitApi.diff(projectId, diffPath),
    enabled: diffPath !== undefined,
  });

  const invalidateGit = async () => {
    await queryClient.invalidateQueries({ queryKey: ['git', projectId] });
  };

  const initMutation = useMutation({
    mutationFn: () => gitApi.init(projectId),
    onSuccess: async () => {
      await invalidateGit();
      Toast.show({ type: 'success', text1: 'Repository Initialized' });
    },
    onError: (error) =>
      Toast.show({ type: 'error', text1: 'Git init failed', text2: getErrorMessage(error) }),
  });
  const commitMutation = useMutation({
    mutationFn: (message: string) => gitApi.commit(projectId, message),
    onSuccess: async (result) => {
      setCommitVisible(false);
      await invalidateGit();
      Toast.show({ type: 'success', text1: `Committed ${result.commit}`, text2: result.summary });
    },
    onError: (error) =>
      Toast.show({ type: 'error', text1: 'Commit failed', text2: getErrorMessage(error) }),
  });
  const remoteMutation = useMutation({
    mutationFn: (url: string) => gitApi.setRemote(projectId, url),
    onSuccess: async (result) => {
      setRemoteVisible(false);
      await invalidateGit();
      Toast.show({ type: 'success', text1: 'Origin Updated', text2: result.remote });
    },
    onError: (error) =>
      Toast.show({ type: 'error', text1: 'Remote failed', text2: getErrorMessage(error) }),
  });
  const pushMutation = useMutation({
    mutationFn: async () => {
      let progress = await gitApi.startPush(projectId);
      const startedAt = Date.parse(progress.startedAt);
      setPushElapsedSeconds(0);
      setPushProgress(progress);
      while (progress.status === 'RUNNING') {
        await wait(PUSH_POLL_INTERVAL_MS);
        progress = await gitApi.pushProgress(projectId, progress.operationId);
        setPushElapsedSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
        setPushProgress(progress);
      }
      if (progress.status === 'FAILED') {
        throw new Error(progress.error || progress.message);
      }
      return progress;
    },
    onSuccess: async (result) => {
      await invalidateGit();
      Toast.show({ type: 'success', text1: `Pushed ${result.branch}` });
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setPushProgress((current) =>
        current?.status === 'RUNNING'
          ? {
              ...current,
              status: 'FAILED',
              stage: 'FAILED',
              message: 'Push progress stopped',
              error: message,
            }
          : current,
      );
      Toast.show({ type: 'error', text1: 'Push failed', text2: message });
    },
  });
  const pullMutation = useMutation({
    mutationFn: () => gitApi.pull(projectId),
    onSuccess: async () => {
      await Promise.all([
        invalidateGit(),
        queryClient.invalidateQueries({ queryKey: ['files', projectId] }),
      ]);
      Toast.show({ type: 'success', text1: 'Pull Complete' });
    },
    onError: (error) =>
      Toast.show({ type: 'error', text1: 'Pull failed', text2: getErrorMessage(error) }),
  });

  const statusError = getErrorMessage(statusQuery.error, '');
  const notRepository = statusError.toLowerCase().includes('not a git repository');

  if (statusQuery.isLoading) {
    return (
      <Screen>
        <AppHeader title="Git" subtitle={projectQuery.data?.name} back />
        <LoadingState label="Reading repository…" />
      </Screen>
    );
  }

  if (!statusQuery.data) {
    return (
      <Screen>
        <AppHeader title="Git" subtitle={projectQuery.data?.name} back />
        {notRepository ? (
          <EmptyState
            icon="git-branch-outline"
            title="Git is Not Initialized"
            description={
              projectQuery.data?.desktopPath
                ? 'Initialize Git directly in the selected desktop folder.'
                : 'Initialize a repository in the synced project store. Commits will use the local PocketDev identity.'
            }
            actionLabel={initMutation.isPending ? 'Initializing…' : 'Initialize Git'}
            onAction={() => initMutation.mutate()}
          />
        ) : (
          <ErrorState message={statusError} onRetry={() => void statusQuery.refetch()} />
        )}
      </Screen>
    );
  }

  const status = statusQuery.data;
  const pushPercent = Math.max(0, Math.min(100, pushProgress?.percent ?? 0));
  const pushProgressWidth = `${pushPercent}%` as `${number}%`;

  return (
    <Screen>
      <AppHeader title="Git" subtitle={projectQuery.data?.name} back />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-24 pt-4"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={statusQuery.isRefetching}
            onRefresh={() => void invalidateGit()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.elevated}
          />
        }
      >

      <Card className="gap-3.5 border border-white/[0.08] bg-[#1C1C1E]">
        <View className="flex-row items-start justify-between gap-3">
          <View>
            <AppText variant="label">Current Branch</AppText>
            <AppText variant="heading" className="mt-0.5 text-[18px]">
              {status.branch}
            </AppText>
          </View>
          <Badge
            label={status.clean ? 'Clean' : `${status.files.length} changed`}
            tone={status.clean ? 'success' : 'warning'}
            dot
          />
        </View>

        <View className="mt-1 flex-row gap-2.5">
          <View className="flex-1 rounded-xl border border-white/[0.06] bg-[#2C2C2E] p-3">
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.50)]">Ahead</AppText>
            <AppText variant="heading" className="text-[17px] text-white">{status.ahead}</AppText>
          </View>
          <View className="flex-1 rounded-xl border border-white/[0.06] bg-[#2C2C2E] p-3">
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.50)]">Behind</AppText>
            <AppText variant="heading" className="text-[17px] text-white">{status.behind}</AppText>
          </View>
          <View className="flex-1 rounded-xl border border-white/[0.06] bg-[#2C2C2E] p-3">
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.50)]">Branches</AppText>
            <AppText variant="heading" className="text-[17px] text-white">{branchesQuery.data?.all.length ?? '—'}</AppText>
          </View>
        </View>

        <View className="border-t border-white/[0.06] pt-3">
          <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.50)]">Origin</AppText>
          <AppText
            variant="mono"
            className={`mt-0.5 text-xs ${status.remoteUrl ? 'text-[#64D2FF]' : 'text-[rgba(235,235,245,0.40)]'}`}
            numberOfLines={2}
          >
            {status.remoteUrl ?? 'Not connected'}
          </AppText>
        </View>
      </Card>

      {/* Apple iOS Segmented Control */}
      <View className="flex-row rounded-xl border border-white/[0.08] bg-[#1C1C1E] p-1">
        {(['changes', 'history'] as const).map((value) => {
          const selected = section === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSection(value)}
              className={cn(
                'flex-1 items-center justify-center rounded-lg py-2 transition-all active:opacity-80',
                selected ? 'bg-[#2C2C2E] shadow-sm' : 'bg-transparent',
              )}
            >
              <AppText
                className={cn(
                  'text-xs font-semibold',
                  selected ? 'text-white' : 'text-[rgba(235,235,245,0.55)]',
                )}
              >
                {value === 'changes' ? 'Changes' : 'History'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {section === 'changes' ? (
        <Card className="overflow-hidden p-0 border border-white/[0.08] bg-[#1C1C1E]">
          {status.files.length ? (
            status.files.map((file) => (
              <GitFileRow key={file.path} file={file} onPress={() => setDiffPath(file.path)} />
            ))
          ) : (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Working Tree Clean"
              description="There are no changes to commit."
            />
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 border border-white/[0.08] bg-[#1C1C1E]">
          {logQuery.isLoading ? (
            <LoadingState label="Loading commits…" />
          ) : logQuery.data?.length ? (
            logQuery.data.map((entry) => (
              <View key={entry.hash} className="border-b border-white/[0.06] px-4 py-3">
                <View className="flex-row items-center gap-2">
                  <AppText variant="mono" className="text-xs text-[#64D2FF]">
                    {entry.hash}
                  </AppText>
                  <AppText className="min-w-0 flex-1 font-semibold text-white text-[14px]" numberOfLines={1}>
                    {entry.message}
                  </AppText>
                </View>
                <AppText variant="caption" className="mt-1 text-xs text-[rgba(235,235,245,0.50)]">
                  {entry.author} · {formatRelativeDate(entry.date)}
                </AppText>
              </View>
            ))
          ) : (
            <EmptyState
              icon="time-outline"
              title="No Commits Yet"
              description="Your commit history will appear here."
            />
          )}
        </Card>
      )}

      {pushProgress ? (
        <Card className="gap-3 border border-[#0091FF]/30 bg-[#1C1C1E]">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText variant="label">
                {pushProgress.status === 'COMPLETED'
                  ? 'Push Complete'
                  : pushProgress.status === 'FAILED'
                    ? 'Push Failed'
                    : 'Pushing to Origin'}
              </AppText>
              <AppText className="mt-1 text-xs text-[rgba(235,235,245,0.75)]" numberOfLines={3}>
                {pushProgress.error ?? pushProgress.message}
              </AppText>
            </View>
            <Badge
              label={`${pushPercent}%`}
              tone={
                pushProgress.status === 'COMPLETED'
                  ? 'success'
                  : pushProgress.status === 'FAILED'
                    ? 'danger'
                    : 'primary'
              }
            />
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-white/10">
            <View
              className={`h-full rounded-full ${
                pushProgress.status === 'FAILED' ? 'bg-[#FF453A]' : 'bg-[#0091FF]'
              }`}
              style={{ width: pushProgressWidth }}
            />
          </View>
          <AppText variant="mono" className="text-[11px] text-[rgba(235,235,245,0.45)]">
            {pushProgress.branch} · {pushProgress.stage.toLowerCase()} · {pushElapsedSeconds}s
          </AppText>
        </Card>
      ) : null}

      <View className="flex-row gap-2.5">
        <Button
          label="Pull"
          icon="arrow-down"
          variant="secondary"
          className="flex-1"
          loading={pullMutation.isPending}
          disabled={pushMutation.isPending}
          onPress={() => pullMutation.mutate()}
        />
        <Button
          label={pushMutation.isPending ? `Pushing ${pushPercent}%` : 'Push'}
          icon="arrow-up"
          variant="secondary"
          className="flex-1"
          disabled={pushMutation.isPending || pullMutation.isPending}
          onPress={() => pushMutation.mutate()}
        />
      </View>
      <Button
        label="Commit All Changes"
        icon="git-commit-outline"
        fullWidth
        disabled={status.clean}
        onPress={() => setCommitVisible(true)}
      />
      <Button
        label="Configure Origin"
        icon="link-outline"
        variant="ghost"
        fullWidth
        onPress={() => setRemoteVisible(true)}
      />
      <AppText variant="caption" className="text-center text-xs text-[rgba(235,235,245,0.45)] leading-4.5">
        Commit stages every changed file. Push and pull use credentials configured on the{' '}
        {projectQuery.data?.desktopPath ? 'connected desktop' : 'PocketDev server'}.
      </AppText>
      </ScrollView>

      {commitVisible ? (
        <GitTextModal
          visible
          title="Commit All Changes"
          description={`${status.files.length} changed file${status.files.length === 1 ? '' : 's'} will be staged and committed.`}
          label="Commit Message"
          placeholder="Describe your changes"
          actionLabel="Commit"
          multiline
          loading={commitMutation.isPending}
          onClose={() => setCommitVisible(false)}
          onSubmit={(message) => commitMutation.mutate(message)}
        />
      ) : null}
      {remoteVisible ? (
        <GitTextModal
          visible
          title="Configure Origin"
          description={`HTTPS credentials or SSH keys must already be configured on the ${
            projectQuery.data?.desktopPath ? 'connected desktop' : 'PocketDev server'
          }.`}
          label="Remote URL"
          placeholder="git@github.com:owner/repo.git"
          actionLabel="Save Origin"
          loading={remoteMutation.isPending}
          onClose={() => setRemoteVisible(false)}
          onSubmit={(url) => remoteMutation.mutate(url)}
        />
      ) : null}
      <DiffModal
        visible={diffPath !== undefined}
        path={diffPath}
        diff={diffQuery.data?.diff}
        loading={diffQuery.isLoading}
        onClose={() => setDiffPath(undefined)}
      />
    </Screen>
  );
}
