import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { getApiBaseUrl } from '@/api/axios';
import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import { saveApiUrl } from '@/services/apiSettings';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/utils/errors';

export function ServerConfiguration() {
  const queryClient = useQueryClient();
  const { isAuthenticated, logout } = useAuth();
  const initialUrl = getApiBaseUrl();
  const [url, setUrl] = useState(initialUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const saveAndTest = async () => {
    const normalized = url.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/i.test(normalized)) {
      setError('Enter a complete http:// or https:// URL.');
      return;
    }

    setTesting(true);
    setError(null);
    try {
      const response = await axios.get<{ status: string }>(`${normalized}/health`, {
        timeout: 10_000,
      });
      if (response.data.status !== 'ok') {
        throw new Error('The server returned an unexpected health response.');
      }
      await saveApiUrl(normalized);
      if (isAuthenticated && initialUrl !== normalized) {
        await logout();
        router.replace('/(auth)/login');
        return;
      }
      await queryClient.invalidateQueries();
      router.back();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not reach this server.'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <AuthShell
      title="Connect Server"
      subtitle="PocketDev talks directly to your NestJS API. You can change this endpoint at any time."
    >
      <View className="gap-4">
        <Input
          label="PocketDev API URL"
          placeholder="https://api.your-domain.com"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          className="font-mono text-sm"
          hint="Use an HTTPS URL reachable from this phone. localhost points to the phone itself."
        />
        {error ? (
          <View className="flex-row items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 py-3">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <AppText className="flex-1 text-xs text-[#FF453A] leading-4.5">
              {error}
            </AppText>
          </View>
        ) : null}
        <Button
          label="Save & Connect"
          icon="cloud-done-outline"
          size="lg"
          fullWidth
          loading={testing}
          onPress={() => void saveAndTest()}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </AuthShell>
  );
}
