import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemePicker } from '@/features/theme/theme-picker';
import { Screen, ScreenHeader } from '@/ui/screen';

export default function ThemeScreen() {
  return (
    <Screen>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.container}>
        <ThemePicker onDone={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
});
