import { forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';
import { cn } from '@/utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, className, containerClassName, multiline, ...props },
  ref,
) {
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? <AppText variant="label" className="px-0.5">{label}</AppText> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.subtle}
        selectionColor={colors.primary}
        multiline={multiline}
        className={cn(
          'rounded-xl border border-white/[0.10] bg-[#1C1C1E] px-4 text-[16px] text-white',
          multiline ? 'min-h-[110px] py-3.5' : 'h-12',
          error && 'border-[#FF453A]',
          className,
        )}
        {...props}
      />
      {error ? (
        <AppText className="px-0.5 text-xs text-[#FF453A]">{error}</AppText>
      ) : hint ? (
        <AppText variant="caption" className="px-0.5 text-xs text-[rgba(235,235,245,0.50)]">{hint}</AppText>
      ) : null}
    </View>
  );
});
