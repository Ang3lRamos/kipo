import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { AlarmClock, House, KeyRound, Settings, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

const tabs: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Inicio', icon: House },
  expiring: { label: 'Por vencer', icon: AlarmClock },
  keys: { label: 'Claves', icon: KeyRound },
  settings: { label: 'Ajustes', icon: Settings },
};

// Barra inferior propia: la pestaña activa lleva fondo pastel.
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const { colors } = theme;
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 8) },
        theme.shadow.float,
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const Icon = tab.icon;
        const fg = focused ? colors.onPrimary : colors.textMuted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={[
              styles.tab,
              { borderRadius: theme.radius.lg },
              focused && { backgroundColor: colors.primary },
            ]}
          >
            <Icon color={fg} size={22} strokeWidth={2} />
            <AppText variant="caption" color={fg}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingTop: 8 },
  tab: { alignItems: 'center', flex: 1, gap: 2, justifyContent: 'center', minHeight: 52 },
});
