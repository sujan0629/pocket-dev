import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { DesktopDirectoryListing } from '@pocketdev/shared';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { desktopApi } from '@/api/pocketdev';
import { AppText } from '@/components/ui/AppText';
import { Button, IconButton } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/utils/errors';

interface DesktopFolderSelection {
  name: string;
  path: string;
}

interface NewProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateBlank: () => void;
  onSelectDesktopFolder: (selection: DesktopFolderSelection) => Promise<unknown>;
}

type ViewMode = 'choices' | 'browse';

export function NewProjectModal({
  visible,
  onClose,
  onCreateBlank,
  onSelectDesktopFolder,
}: NewProjectModalProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ViewMode>('choices');
  const [path, setPath] = useState<string | undefined>();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const desktopQuery = useQuery({
    queryKey: ['desktop-status'],
    queryFn: desktopApi.status,
    enabled: visible,
    refetchInterval: visible ? 10_000 : false,
  });
  const browseQuery = useQuery({
    queryKey: ['desktop-browse', path ?? '<roots>'],
    queryFn: () => desktopApi.browse(path),
    enabled: visible && mode === 'browse' && Boolean(desktopQuery.data?.online),
  });

  const close = () => {
    if (!linking) onClose();
  };

  const showBlankForm = () => {
    if (linking) return;
    onClose();
    onCreateBlank();
  };

  const goBack = () => {
    setLinkError(null);
    if (mode === 'choices') {
      close();
      return;
    }
    const listing = browseQuery.data;
    if (!listing?.path) {
      setMode('choices');
      return;
    }
    setPath(listing.parentPath ?? undefined);
  };

  const selectCurrentFolder = async (listing: DesktopDirectoryListing) => {
    if (!listing.path || linking) return;
    setLinkError(null);
    setLinking(true);
    try {
      await onSelectDesktopFolder({
        name: listing.name,
        path: listing.path,
      });
    } catch (error) {
      setLinkError(getErrorMessage(error, 'Could not link this desktop folder.'));
      setLinking(false);
    }
  };

  const desktop = desktopQuery.data;
  const desktopOnline = Boolean(desktop?.online && desktop.tunnelUrl);
  const listing = browseQuery.data;
  const canSelectCurrentFolder = Boolean(listing?.path && listing.parentPath !== null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
      onShow={() => {
        setMode('choices');
        setPath(undefined);
        setLinkError(null);
        setLinking(false);
      }}
    >
      <View className="flex-1 justify-end bg-black/65">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close new project options"
          className="flex-1"
          onPress={close}
        />

        <View
          className="max-h-[92%] min-h-[56%] rounded-t-[28px] border-t border-white/[0.12] bg-[#1C1C1E] shadow-2xl"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          {/* Apple Sheet Grabber */}
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-9 rounded-full bg-white/20" />
          </View>

          <View className="flex-row items-center gap-3 px-5 pb-4">
            <IconButton
              icon={mode === 'browse' ? 'chevron-back' : 'close'}
              label={mode === 'browse' ? 'Go back' : 'Close'}
              size={18}
              disabled={linking}
              onPress={goBack}
            />
            <View className="min-w-0 flex-1">
              <AppText variant="title">
                {mode === 'browse' ? 'Desktop Folders' : 'New Project'}
              </AppText>
              <AppText variant="caption" className="mt-0.5 text-xs text-[rgba(235,235,245,0.60)]" numberOfLines={1}>
                {mode === 'browse'
                  ? (listing?.path ?? 'Choose a drive')
                  : 'Link existing code or start with a blank workspace.'}
              </AppText>
            </View>
          </View>

          {mode === 'choices' ? (
            <ScrollView
              className="px-5"
              contentContainerClassName="gap-3.5 pb-4"
              showsVerticalScrollIndicator={false}
            >
              <View className="rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-4.5">
                <View className="flex-row items-start gap-3.5">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#0091FF]/15 border border-[#0091FF]/20">
                    <Ionicons name="desktop-outline" size={22} color={colors.primary} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-center gap-2">
                      <AppText className="text-[17px] font-semibold text-white">From Connected Desktop</AppText>
                      {desktopOnline ? (
                        <View className="h-2 w-2 rounded-full bg-[#30D158]" />
                      ) : null}
                    </View>
                    <AppText variant="caption" className="mt-1 text-xs leading-5 text-[rgba(235,235,245,0.65)]">
                      {desktopQuery.isLoading
                        ? 'Checking your desktop connection…'
                        : desktopOnline
                          ? `${desktop?.deviceName ?? 'Desktop'} is online. Browse drives and choose an existing project folder.`
                          : 'Start your desktop agent to browse drives and link an existing folder.'}
                    </AppText>
                  </View>
                </View>
                {desktopQuery.isError ? (
                  <AppText className="mt-3 text-xs text-[#FF453A]">
                    {getErrorMessage(desktopQuery.error, 'Desktop status is unavailable.')}
                  </AppText>
                ) : null}
                <Button
                  label={desktopOnline ? 'Browse Desktop' : 'Desktop Offline'}
                  icon="folder-open-outline"
                  variant={desktopOnline ? 'primary' : 'secondary'}
                  className="mt-4"
                  fullWidth
                  disabled={!desktopOnline}
                  onPress={() => {
                    setPath(undefined);
                    setMode('browse');
                  }}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create a blank project"
                className="rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-4.5 active:bg-[#2C2C2E] active:scale-[0.99]"
                disabled={linking}
                onPress={showBlankForm}
              >
                <View className="flex-row items-center gap-3.5">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
                    <Ionicons name="add" size={22} color={colors.text} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText className="text-[17px] font-semibold text-white">Create Blank Project</AppText>
                    <AppText variant="caption" className="mt-0.5 text-xs text-[rgba(235,235,245,0.60)] leading-4">
                      Create an empty cloud workspace for quick prototyping.
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(235, 235, 245, 0.30)" />
                </View>
              </Pressable>
            </ScrollView>
          ) : (
            <View className="min-h-0 flex-1">
              {browseQuery.isLoading ? (
                <View className="flex-1 items-center justify-center gap-3 px-5">
                  <ActivityIndicator color={colors.primary} />
                  <AppText variant="caption" className="text-sm text-[rgba(235,235,245,0.60)]">
                    Reading folders from your desktop…
                  </AppText>
                </View>
              ) : browseQuery.isError ? (
                <View className="flex-1 justify-center px-5">
                  <View className="items-center rounded-2xl border border-white/[0.08] bg-[#1C1C1E] p-5">
                    <Ionicons name="warning-outline" size={26} color={colors.danger} />
                    <AppText className="mt-3 text-[17px] font-semibold text-white text-center">
                      Couldn’t Open This Location
                    </AppText>
                    <AppText variant="caption" className="mt-1.5 text-center text-xs leading-5 text-[rgba(235,235,245,0.65)]">
                      {getErrorMessage(
                        browseQuery.error,
                        'Restart the connected desktop agent and try again.',
                      )}
                    </AppText>
                    <Button
                      label="Try Again"
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onPress={() => void browseQuery.refetch()}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <ScrollView
                    className="px-5"
                    contentContainerClassName="gap-2 pb-3"
                    showsVerticalScrollIndicator={false}
                  >
                    {listing?.entries.map((entry) => (
                      <Pressable
                        key={entry.path}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${entry.name}`}
                        className="flex-row items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1C1C1E] px-4 py-3 active:bg-[#2C2C2E]"
                        onPress={() => {
                          setLinkError(null);
                          setPath(entry.path);
                        }}
                      >
                        <View className="h-9 w-9 items-center justify-center rounded-lg bg-white/[0.08]">
                          <Ionicons
                            name={entry.kind === 'drive' ? 'server-outline' : 'folder-outline'}
                            size={19}
                            color={entry.hasGit ? colors.success : colors.primary}
                          />
                        </View>
                        <View className="min-w-0 flex-1">
                          <AppText variant="body" className="text-[15px]" numberOfLines={1}>
                            {entry.name}
                          </AppText>
                          {entry.hasGit ? (
                            <AppText variant="caption" className="mt-0.5 text-xs text-[#30D158]">
                              Git repository
                            </AppText>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="rgba(235, 235, 245, 0.30)" />
                      </Pressable>
                    ))}

                    {listing && listing.entries.length === 0 ? (
                      <View className="items-center py-12">
                        <Ionicons name="folder-open-outline" size={28} color={colors.muted} />
                        <AppText variant="caption" className="mt-2 text-[rgba(235,235,245,0.60)]">
                          This folder has no subfolders.
                        </AppText>
                      </View>
                    ) : null}
                  </ScrollView>

                  <View className="border-t border-white/[0.08] px-5 pt-3.5">
                    {linkError ? (
                      <AppText className="mb-3 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/15 px-4 py-3 text-xs text-[#FF453A]">
                        {linkError}
                      </AppText>
                    ) : null}
                    <Button
                      label={
                        canSelectCurrentFolder
                          ? `Use “${listing?.name ?? 'this folder'}”`
                          : 'Open a project folder'
                      }
                      icon="link-outline"
                      fullWidth
                      disabled={!canSelectCurrentFolder}
                      loading={linking}
                      onPress={() => {
                        if (listing) void selectCurrentFolder(listing);
                      }}
                    />
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
