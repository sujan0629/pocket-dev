import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';

export function TerminalInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (data: string) => void;
}) {
  const [input, setInput] = useState('');
  const insets = useSafeAreaInsets();

  const submit = () => {
    if (disabled) return;
    onSend(`${input}\r`);
    setInput('');
  };

  return (
    <View
      className="border-t border-white/[0.08] bg-[#1C1C1E]"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      {/* iOS Keyboard Accessory Bar */}
      <View className="flex-row gap-2 px-3.5 py-2">
        {[
          ['Ctrl+C', '\u0003'],
          ['Tab', '\t'],
          ['↑', '\u001b[A'],
          ['↓', '\u001b[B'],
          ['Esc', '\u001b'],
        ].map(([label, data]) => (
          <Pressable
            key={label}
            disabled={disabled}
            onPress={() => onSend(data)}
            className="h-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#2C2C2E] px-3 active:bg-[#3A3A3C] disabled:opacity-40"
          >
            <AppText variant="mono" className="text-xs font-medium text-white/90">
              {label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center gap-2.5 px-3.5 pb-2.5">
        <AppText variant="mono" className="text-[15px] font-bold text-[#0091FF]">
          $
        </AppText>
        <TextInput
          value={input}
          onChangeText={setInput}
          editable={!disabled}
          onSubmitEditing={submit}
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={disabled ? 'Waiting for terminal…' : 'Enter command…'}
          placeholderTextColor={colors.subtle}
          selectionColor={colors.primary}
          className="h-11 flex-1 rounded-xl border border-white/[0.10] bg-[#2C2C2E] px-3.5 font-mono text-sm text-white"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send terminal input"
          disabled={disabled || !input.trim()}
          onPress={submit}
          className="h-11 items-center justify-center rounded-xl bg-[#0091FF] px-4 active:bg-[#0077ED] disabled:opacity-40"
        >
          <AppText className="text-sm font-semibold text-white">Send</AppText>
        </Pressable>
      </View>
    </View>
  );
}
