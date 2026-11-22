import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/ui/empty-state';
import { Screen } from '@/ui/screen';
import { AppText } from '@/ui/text';

// Contraseñas y notas seguras llegan en la fase 7 (PLAN.md).
export default function KeysScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <AppText variant="h1">Claves</AppText>
        <EmptyState
          mood="guino"
          title="Muy pronto"
          message="Aquí vas a guardar contraseñas, notas seguras y códigos de dos pasos, cifrados igual que tus documentos."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
