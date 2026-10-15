import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/utils/errors';

const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(80, 'Name must be 80 characters or fewer.'),
  slug: z
    .string()
    .trim()
    .max(64, 'Slug must be 64 characters or fewer.')
    .refine(
      (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      'Use lowercase letters, numbers, and single hyphens.',
    ),
  description: z.string().trim().max(280, 'Description must be 280 characters or fewer.'),
});

type FormValues = z.infer<typeof createProjectSchema>;

export interface CreateProjectValues {
  name: string;
  slug?: string;
  description?: string;
}

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (values: CreateProjectValues) => Promise<unknown>;
}

export function CreateProjectModal({ visible, onClose, onCreate }: CreateProjectModalProps) {
  const insets = useSafeAreaInsets();
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [reset, visible]);

  const close = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const submit = handleSubmit(async (values) => {
    clearErrors('root');

    try {
      await onCreate({
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
      });
    } catch (error) {
      setError('root', {
        message: getErrorMessage(error, 'Could not create the project.'),
      });
    }
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/65">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close new project form"
            className="flex-1"
            onPress={close}
          />

          <View
            className="max-h-[90%] rounded-t-[28px] border-t border-white/[0.12] bg-[#1C1C1E] shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            {/* Apple Sheet Grabber */}
            <View className="items-center pb-2 pt-3">
              <View className="h-1 w-9 rounded-full bg-white/20" />
            </View>

            <ScrollView
              className="px-5"
              contentContainerClassName="pb-4"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AppText variant="title">New Project</AppText>
              <AppText variant="caption" className="mt-1 leading-5 text-[rgba(235,235,245,0.60)]">
                Create a workspace for files, terminal sessions, and Git.
              </AppText>

              <View className="mt-5 gap-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <Input
                      label="Project Name"
                      placeholder="My awesome app"
                      autoCapitalize="words"
                      autoCorrect={false}
                      autoFocus
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.name?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="slug"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <Input
                      label="Slug (optional)"
                      placeholder="my-awesome-app"
                      hint="Leave blank to generate one automatically."
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={(nextValue) => onChange(nextValue.toLowerCase())}
                      error={errors.slug?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <Input
                      label="Description (optional)"
                      placeholder="What are you building?"
                      multiline
                      maxLength={280}
                      textAlignVertical="top"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.description?.message}
                    />
                  )}
                />
              </View>

              {errors.root?.message ? (
                <View className="mt-4 flex-row items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#2C2C2E] px-4 py-3">
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <AppText className="flex-1 text-xs text-[#FF453A] leading-4.5">
                    {errors.root.message}
                  </AppText>
                </View>
              ) : null}

              <View className="mt-6 flex-row gap-3">
                <Button
                  label="Cancel"
                  variant="secondary"
                  className="flex-1"
                  disabled={isSubmitting}
                  onPress={close}
                />
                <Button
                  label="Create Project"
                  icon="add"
                  className="flex-1"
                  loading={isSubmitting}
                  onPress={() => void submit()}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
