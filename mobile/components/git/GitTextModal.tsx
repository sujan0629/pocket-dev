import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function GitTextModal({
  visible,
  title,
  description,
  label,
  placeholder,
  actionLabel,
  loading,
  multiline = false,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder: string;
  actionLabel: string;
  loading: boolean;
  multiline?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/65">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
            className="flex-1"
            onPress={onClose}
          />
          <View
            className="max-h-[90%] min-h-[45%] rounded-t-[28px] border-t border-white/[0.12] bg-[#1C1C1E] shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {/* Apple Sheet Grabber */}
            <View className="items-center pb-2 pt-3">
              <View className="h-1 w-9 rounded-full bg-white/20" />
            </View>
            <ScrollView
              className="px-5"
              contentContainerClassName="pb-4"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              <AppText variant="title">{title}</AppText>
              {description ? (
                <AppText variant="caption" className="mt-1 text-xs leading-5 text-[rgba(235,235,245,0.60)]">
                  {description}
                </AppText>
              ) : null}
              <Input
                label={label}
                placeholder={placeholder}
                value={value}
                onChangeText={setValue}
                autoCapitalize={multiline ? 'sentences' : 'none'}
                autoCorrect={multiline}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                className={multiline ? undefined : 'font-mono'}
                containerClassName="mt-5"
                autoFocus
              />
              <View className="mt-6 flex-row gap-3">
                <Button
                  label="Cancel"
                  variant="secondary"
                  className="flex-1"
                  disabled={loading}
                  onPress={onClose}
                />
                <Button
                  label={actionLabel}
                  className="flex-1"
                  loading={loading}
                  disabled={!value.trim()}
                  onPress={() => onSubmit(value.trim())}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
