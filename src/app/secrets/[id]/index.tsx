import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useDelete } from '@/features/lists/use-delete';
import { BrandAvatar } from '@/features/secrets/brand-avatar';
import { kindInfo } from '@/features/secrets/kinds';
import { SecretDetails } from '@/features/secrets/secret-details';
import { useSecret } from '@/features/secrets/use-secrets';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { EmptyState } from '@/ui/empty-state';
import { IconButton } from '@/ui/icon-button';
import { Screen, ScreenHeader } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

export default function SecretDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: secret, loading } = useSecret(id);
  const edit = () => router.push({ pathname: '/secrets/[id]/edit', params: { id } });

  const remove = useDelete('secrets');
  const confirmDelete = async () => {
    if (secret && (await remove([secret.id], secret.title))) router.back();
  };

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
          <IconButton icon={Pencil} accessibilityLabel="Editar" tone="surface" onPress={edit} />
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
        <Button
          label="Eliminar clave"
          variant="danger"
          icon={Trash2}
          onPress={() => void confirmDelete()}
        />
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
