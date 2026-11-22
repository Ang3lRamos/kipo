import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/features/navigation/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="expiring" />
      <Tabs.Screen name="keys" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
