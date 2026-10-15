import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/utils/errors';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      router.replace('/(tabs)/home');
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'Could not sign in.') });
    }
  });

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Your workspaces, terminal sessions, and Git workflow—right from your pocket."
    >
      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              label="Password"
              placeholder="Your password"
              secureTextEntry
              textContentType="password"
              returnKeyType="done"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={() => void submit()}
              error={errors.password?.message}
            />
          )}
        />
        {errors.root?.message ? (
          <View className="flex-row items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 py-3">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <AppText className="flex-1 text-xs text-[#FF453A] leading-4.5">
              {errors.root.message}
            </AppText>
          </View>
        ) : null}
        <Button
          label="Sign In"
          icon="arrow-forward"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={() => void submit()}
        />
      </View>

      <View className="mt-8 flex-row items-center justify-center gap-1.5">
        <AppText variant="caption">New to PocketDev?</AppText>
        <Link href="/(auth)/register" asChild>
          <Pressable hitSlop={10} className="active:opacity-60">
            <AppText className="font-semibold text-[#0091FF]">Create an account</AppText>
          </Pressable>
        </Link>
      </View>
      <Button
        label="Server Connection"
        icon="server-outline"
        variant="ghost"
        fullWidth
        className="mt-3"
        onPress={() => router.push('/(auth)/server')}
      />
    </AuthShell>
  );
}
