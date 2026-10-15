import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { desktopApi, projectsApi } from '@/api/pocketdev';
import { ProjectSummary } from '@/components/projects/ProjectSummary';
import { WorkspaceAction } from '@/components/projects/WorkspaceAction';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateView';
import { getErrorMessage } from '@/utils/errors';

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function ProjectWorkspaceScreen() {
  const { projectId: rawProjectId } = useLocalSearchParams<{ projectId: string }>();
  const projectId = param(rawProjectId);
  const queryClient = useQueryClient();
  const [command, setCommand] = useState('npm run');

  const projectQuery = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: Boolean(projectId),
  });
  const desktopQuery = useQuery({
    queryKey: ['desktop-status'],
    queryFn: desktopApi.status,
    refetchInterval: 15_000,
  });
  const removeMutation = useMutation({
    mutationFn: () => projectsApi.remove(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      Toast.show({ type: 'success', text1: 'Project Deleted' });
      router.replace('/(tabs)/home');
    },
    onError: (error) =>
      Toast.show({
        type: 'error',
        text1: 'Could not delete project',
        text2: getErrorMessage(error),
      }),
  });

  const project = projectQuery.data;

  const confirmDelete = () => {
    Alert.alert(
      'Delete Project?',
      'This removes the project record, its jobs, and sessions. Your original local folder is not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeMutation.mutate(),
        },
      ],
    );
  };

  if (projectQuery.isLoading) {
    return (
      <Screen>
        <AppHeader title="Workspace" back />
        <LoadingState label="Opening workspace…" />
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen>
        <AppHeader title="Workspace" back />
        <ErrorState
          message={getErrorMessage(projectQuery.error, 'Project not found.')}
          onRetry={() => void projectQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title={project.name} subtitle="Workspace" back />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-24 pt-4"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
      >
        <ProjectSummary project={project} desktop={desktopQuery.data} />

        <View>
          <AppText variant="label" className="mb-2.5 px-0.5">
            Workspace Tools
          </AppText>
          <View className="flex-row gap-3">
            <WorkspaceAction
              icon="folder-open-outline"
              title="Files"
              description="Browse and edit files"
              onPress={() =>
                router.push({
                  pathname: '/projects/[projectId]/files',
                  params: { projectId },
                })
              }
            />
            <WorkspaceAction
              icon="git-branch-outline"
              title="Git"
              description="Commit, push & diff"
              onPress={() =>
                router.push({
                  pathname: '/projects/[projectId]/git',
                  params: { projectId },
                })
              }
            />
          </View>
        </View>

        <Card className="gap-2">
          <AppText variant="heading">Run Command</AppText>
          <AppText variant="caption" className="text-xs leading-4.5 text-[rgba(235,235,245,0.60)]">
            Starts an interactive shell, executes the initial command, and keeps the terminal live for more.
          </AppText>
          <Input
            label="Initial Command"
            value={command}
            onChangeText={setCommand}
            autoCapitalize="none"
            autoCorrect={false}
            className="font-mono text-sm"
            containerClassName="mt-3"
            returnKeyType="go"
            onSubmitEditing={() => {
              if (!command.trim()) return;
              router.push({
                pathname: '/projects/[projectId]/terminal',
                params: { projectId, command: command.trim(), autorun: '1' },
              });
            }}
          />
          <Button
            label="Open Terminal"
            icon="terminal-outline"
            fullWidth
            className="mt-3.5"
            disabled={!command.trim()}
            onPress={() =>
              router.push({
                pathname: '/projects/[projectId]/terminal',
                params: { projectId, command: command.trim() },
              })
            }
          />
        </Card>

        <Card className="gap-2.5">
          <AppText variant="heading" className="text-[17px]">Project Details</AppText>
          <View className="mt-1.5 flex-row justify-between items-center gap-4 border-b border-white/[0.05] pb-2.5">
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.55)]">Created</AppText>
            <AppText className="text-xs text-[rgba(235,235,245,0.85)]">
              {new Date(project.createdAt).toLocaleDateString()}
            </AppText>
          </View>
          <View className="flex-row justify-between items-center gap-4 border-b border-white/[0.05] pb-2.5">
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.55)]">Project ID</AppText>
            <AppText variant="mono" className="max-w-[65%] text-xs text-[rgba(235,235,245,0.50)]" numberOfLines={1}>
              {project.id}
            </AppText>
          </View>
          <View className="flex-row justify-between items-center gap-4">
            <AppText variant="caption" className="text-xs text-[rgba(235,235,245,0.55)]">Desktop Link</AppText>
            <AppText
              variant="mono"
              className="max-w-[65%] text-right text-xs text-[#64D2FF]"
              numberOfLines={2}
            >
              {project.desktopPath ?? 'Not linked'}
            </AppText>
          </View>
        </Card>

        <View className="pt-2">
          <Button
            label="Delete Project"
            variant="danger"
            icon="trash-outline"
            loading={removeMutation.isPending}
            onPress={confirmDelete}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
