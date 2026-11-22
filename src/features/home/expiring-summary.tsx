import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ExpiringCard } from '@/features/documents/expiring-card';
import { useExpiringDocuments } from '@/features/documents/use-documents';
import { Button } from '@/ui/button';
import { AppText } from '@/ui/text';

// Sección "Por vencer" del inicio: las 2 más próximas.
export function ExpiringSummary() {
  const { data: docs } = useExpiringDocuments();
  if (docs.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.title}>
        <AppText variant="h3">Por vencer</AppText>
        {docs.length > 2 ? (
          <Button variant="ghost" label="Ver todos" onPress={() => router.navigate('/expiring')} />
        ) : null}
      </View>
      <View style={styles.cards}>
        {docs.slice(0, 2).map((doc) => (
          <ExpiringCard key={doc.id} doc={doc} />
        ))}
        {docs.length === 1 ? <View style={styles.spacer} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cards: { flexDirection: 'row', gap: 12 },
  section: { gap: 10 },
  spacer: { flex: 1 },
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
});
