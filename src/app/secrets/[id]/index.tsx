import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { softDeleteSecret } from '@/db/secrets-repo';
import { BrandAvatar } from '@/features/secrets/brand-avatar';
import { kindInfo } from '@/features/secrets/kinds';
import { SecretDetails } from '@/features/secrets/secret-details';
import { useSecret } from '@/features/secrets/use-secrets';
import { afterLocalChange } from '@/sync/after-local-change';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { EmptyState } from '@/ui/empty-state';
import { IconButton } from '@/ui/icon-button';
import { Screen, ScreenHeader } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

export default function SecretDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { data: secret, loading } = useSecret(id);
  const edit = () => router.push({ pathname: '/secrets/[id]/edit', params: { id } });

  const confirmDelete = () => {
    if (!secret) return;
    Alert.alert('Eliminar clave', `¿Eliminar "${secret.title}"? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await softDeleteSecret(db, secret.id);
          afterLocalChange(db); // el borrado también llega a la nube
          router.back();
        },
      },
    ]);
  };

  const openMenu = () =>
    Alert.alert('Opciones', undefined, [
      { text: 'Editar', onPress: edit },
      { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  if (loading) return <Screen>{null}</Screen>;
  if (!secret) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState mood="buscando" title="Esta clave ya no existe" />
      </Screen>
    );
  }

  const info = kindInfo[secret.data.kind];
  const tint = theme.colors.categories[info.tint];
  const Icon = info.icon;

  return (
    <Screen>
      <ScreenHeader
        right={
          <IconButton
            icon={Ellipsis}
            accessibilityLabel="Opciones"
            tone="surface"
            onPress={openMenu}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.badge, { backgroundColor: tint.bg, borderRadius: theme.radius.pill }]}>
          <Icon color={tint.text} size={14} strokeWidth={2} />
          <AppText variant="caption" color={tint.text}>
            {info.label}
          </AppText>
        </View>
        <View style={styles.title}>
          <BrandAvatar title={secret.title} data={secret.data} size={56} />
          <AppText variant="h1" style={styles.flex}>
            {secret.title}
          </AppText>
        </View>
        <Card>
          <SecretDetails data={secret.data} />
        </Card>
        <Button label="Editar" icon={Pencil} onPress={edit} />
        <Button label="Eliminar clave" variant="danger" icon={Trash2} onPress={confirmDelete} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  container: { gap: 16, padding: 16, paddingBottom: 48 },
  flex: { flex: 1 },
  title: { alignItems: 'center', flexDirection: 'row', gap: 12 },
});
