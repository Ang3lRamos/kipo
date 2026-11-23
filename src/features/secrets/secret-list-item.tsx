import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { secretSubtitle } from '@/secrets/secret-rules';
import type { SecretRecord } from '@/types/secret';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { BrandAvatar } from './brand-avatar';
import { kindInfo } from './kinds';

// Fila de la lista de claves: nunca muestra la contraseña, solo el nombre y un subtítulo.
export function SecretListItem({ secret }: { secret: SecretRecord }) {
  const theme = useTheme();
  const info = kindInfo[secret.data.kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${secret.title}, ${info.label}`}
      onPress={() => router.push({ pathname: '/secrets/[id]', params: { id: secret.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl },
        theme.shadow.card,
        pressed && styles.pressed,
      ]}
    >
      <BrandAvatar title={secret.title} data={secret.data} size={48} />
      <View style={styles.body}>
        <AppText variant="bodyMedium" numberOfLines={1}>
          {secret.title}
        </AppText>
        <AppText variant="small" color="textMuted" numberOfLines={1}>
          {secretSubtitle(secret.data)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 12 },
});
