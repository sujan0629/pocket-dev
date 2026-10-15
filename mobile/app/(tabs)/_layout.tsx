import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: '#000000' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginTop: 1,
        },
        tabBarStyle: {
          backgroundColor: 'rgba(28, 28, 30, 0.94)',
          borderTopColor: 'rgba(255, 255, 255, 0.12)',
          borderTopWidth: 0.5,
          elevation: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
        },
        tabBarIcon: ({ color, focused, size }) => {
          // Apple HIG: Outline in toolbars/lists, filled in tab bars when active
          const iconMap = {
            home: {
              active: 'folder' as const,
              inactive: 'folder-outline' as const,
            },
            explore: {
              active: 'pulse' as const,
              inactive: 'pulse-outline' as const,
            },
            profile: {
              active: 'settings' as const,
              inactive: 'settings-outline' as const,
            },
          } as const;

          const icons = iconMap[route.name as keyof typeof iconMap];
          const iconName = icons ? (focused ? icons.active : icons.inactive) : 'ellipse-outline';

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Projects' }} />
      <Tabs.Screen name="explore" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
