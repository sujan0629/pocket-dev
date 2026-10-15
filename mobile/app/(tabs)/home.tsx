import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { desktopApi, projectsApi } from '@/api/pocketdev';
import {
  CreateProjectModal,
  type CreateProjectValues,
} from '@/components/projects/CreateProjectModal';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { colors } from '@/constants/theme';
import type { Project } from '@/types/api';
import { getErrorMessage } from '@/utils/errors';

export default function ProjectsScreen() {
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateProjectValues) => projectsApi.create(values),
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(['projects'], (projects = []) => [
        project,
        ...projects.filter((item) => item.id !== project.id),
      ]);
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateOpen(false);
      Toast.show({
        type: 'success',
        text1: 'Project Created',
        text2: `${project.name} is ready to open.`,
      });
    },
  });

  const linkDesktopMutation = useMutation({
    mutationFn: async ({ name, path }: { name: string; path: string }) => {
      const project = await projectsApi.create({ name: name.slice(0, 80) });
      try {
        return await desktopApi.link(project.id, path);
      } catch (error) {
        await projectsApi.remove(project.id).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(['projects'], (projects = []) => [
        project,
        ...projects.filter((item) => item.id !== project.id),
      ]);
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['desktop-status'] });
      void queryClient.invalidateQueries({ queryKey: ['files', project.id] });
      void queryClient.invalidateQueries({ queryKey: ['git', project.id] });
      setNewOpen(false);
      Toast.show({
        type: 'success',
        text1: 'Desktop Linked',
        text2: `${project.name} opened from ${project.desktopPath}.`,
      });
      router.push(`/projects/${encodeURIComponent(project.id)}` as Href);
    },
  });

  const projects = projectsQuery.data ?? [];
  const projectCountLabel = projectsQuery.isSuccess
    ? `${projects.length} ${projects.length === 1 ? 'workspace' : 'workspaces'}`
    : 'Mobile workspaces';

  return (
    <Screen>
      <AppHeader
        title="Projects"
        subtitle={projectCountLabel}
        right={
          <Button
            label="New"
            icon="add"
            size="sm"
            onPress={() => setNewOpen(true)}
          />
        }
      />

      {projectsQuery.isLoading ? (
        <LoadingState label="Loading workspaces…" />
      ) : projectsQuery.isError && !projectsQuery.data ? (
        <ErrorState
          message={getErrorMessage(
            projectsQuery.error,
            'Your projects could not be loaded. Check your connection and try again.',
          )}
          onRetry={() => void projectsQuery.refetch()}
        />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(project) => project.id}
          className="flex-1"
          contentContainerClassName="grow px-4 pb-28 pt-4"
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl
              refreshing={projectsQuery.isRefetching}
              onRefresh={() => void projectsQuery.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.elevated}
            />
          }
          ListHeaderComponent={
            projects.length > 0 ? (
              <View className="mb-3.5 px-0.5">
                <AppText variant="label">Active Workspaces</AppText>
                <AppText variant="caption" className="mt-0.5 text-xs text-[rgba(235,235,245,0.50)]">
                  Browse files, launch interactive terminals, and manage Git.
                </AppText>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => router.push(`/projects/${encodeURIComponent(item.id)}` as Href)}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center">
              <EmptyState
                icon="folder-open-outline"
                title="Add Your First Project"
                description="Link a folder from your connected desktop or start with a blank cloud workspace."
                actionLabel="New Project"
                onAction={() => setNewOpen(true)}
              />
            </View>
          }
        />
      )}

      <NewProjectModal
        visible={newOpen}
        onClose={() => setNewOpen(false)}
        onCreateBlank={() => setCreateOpen(true)}
        onSelectDesktopFolder={(selection) => linkDesktopMutation.mutateAsync(selection)}
      />

      <CreateProjectModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(values) => createMutation.mutateAsync(values)}
      />
    </Screen>
  );
}
