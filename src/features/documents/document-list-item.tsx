import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { localFile } from '@/files/local-store';
import type { DocumentRecord } from '@/types/document';
import { useTheme } from '@/ui/theme';

import { categoryInfo } from './categories';
import { ExpiryBadge } from './expiry-badge';

export function DocumentListItem({ doc }: { doc: DocumentRecord }) {
  const theme = useTheme();
  const info = categoryInfo[doc.category];

  return (
    // Se navega con router.push: <Link asChild> no acepta estilos en arreglo en esta versión.
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/documents/[id]', params: { id: doc.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: theme.background }]}>
        {doc.thumbPath ? (
          <Image
            source={{ uri: localFile(doc.thumbPath).uri }}
            style={styles.thumbImage}
            contentFit="cover"
            cachePolicy="memory"
          />
        ) : (
          <Text style={styles.icon}>{info.icon}</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {doc.title}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: theme.muted }]}>
          {doc.physicalLocation ? `📍 ${doc.physicalLocation}` : info.label}
        </Text>
        {doc.expiresAt ? <ExpiryBadge expiresAt={doc.expiresAt} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 4 },
  icon: { fontSize: 26 },
  meta: { fontSize: 14 },
  pressed: { opacity: 0.7 },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  thumb: {
    alignItems: 'center',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  thumbImage: { height: '100%', width: '100%' },
  title: { fontSize: 16, fontWeight: '600' },
});
