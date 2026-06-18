import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/use-auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, isGuest, isReady } = useAuth();
  const authed = user !== null || isGuest;

  useEffect(() => {
    if (isReady && !authed) {
      router.replace('/(auth)/login');
    }
  }, [authed, isReady]);

  if (!authed) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="puzzles"
        options={{
          title: 'Puzzles',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="puzzlepiece.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="online"
        options={{
          title: 'Online',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.number" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}