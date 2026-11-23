import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { secretSubtitle } from '@/secrets/secret-rules';
import type { SecretRecord } from '@/types/secret';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { kindInfo } from './kinds';

// Fila de la lista de claves: nunca muestra la contraseña, solo el nombre y un subtítulo.
export function SecretListItem({ secret }: { secret: SecretRecord }) {
  const theme = useTheme();
  const info = kindInfo[secret.data.kind];
  const tint = theme.colors.categories[info.tint];
  const Icon = info.icon;
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
      <View style={[styles.icon, { backgroundColor: tint.bg, borderRadius: theme.radius.md }]}>
        <Icon color={tint.text} size={22} strokeWidth={2} />
      </View>
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
  icon: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  pressed: { opacity: 0.7 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 12 },
});
