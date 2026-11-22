import { MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/ui/card';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

// Tarjeta destacada "¿Dónde está el original?" (colores `location` del tema).
export function LocationCard({ location }: { location: string | null }) {
  const theme = useTheme();
  const { location: tone } = theme.colors;
  return (
    <Card tint={tone.bg}>
      <View style={styles.title}>
        <View style={[styles.icon, { backgroundColor: theme.colors.surface }]}>
          <MapPin color={tone.icon} size={20} strokeWidth={2} />
        </View>
        <AppText variant="label" color={tone.text}>
          ¿Dónde está el original?
        </AppText>
      </View>
      <AppText variant="h3" color={tone.text}>
        {location ?? 'Todavía no anotaste dónde lo guardas.'}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  title: { alignItems: 'center', flexDirection: 'row', gap: 10 },
});
