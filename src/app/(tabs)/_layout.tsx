import React from 'react';
import { Tabs } from 'expo-router';
import { Dock } from '../../components/ui/Dock';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <Dock {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="reader/browse" options={{ title: 'Quran' }} />
      <Tabs.Screen name="reader/index" options={{ href: null }} />
      <Tabs.Screen name="reader/page" options={{ href: null }} />
      <Tabs.Screen name="mosque/index" options={{ title: 'Mosques' }} />
      <Tabs.Screen name="messages/index" options={{ title: 'Community' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
      <Tabs.Screen name="reader/search" options={{ href: null }} />
      <Tabs.Screen name="tasbih/index" options={{ href: null }} />
      <Tabs.Screen name="hadiths/index" options={{ href: null }} />
      <Tabs.Screen name="hadiths/saved" options={{ href: null }} />
      <Tabs.Screen name="hadiths/[collection]" options={{ href: null }} />
      <Tabs.Screen name="hadiths/detail" options={{ href: null }} />
      
      {/* Duas Section */}
      <Tabs.Screen name="duas/index" options={{ href: null }} />
      <Tabs.Screen name="duas/[chapter]" options={{ href: null }} />
      <Tabs.Screen name="messages/chat" options={{ href: null }} />

      <Tabs.Screen name="messages/me" options={{ href: null }} />
      <Tabs.Screen name="messages/hifz" options={{ href: null }} />
      <Tabs.Screen name="saved-feed" options={{ href: null }} />
    </Tabs>
  );
}
