import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Session } from './vault-actions';
import { PrivacyCover } from './privacy-cover';
import { SetupScreen } from './setup-screen';
import { UnlockScreen } from './unlock-screen';
import { useAutoLock } from './use-auto-lock';
import { useVault } from './vault-context';

// Decide qué se ve: configuración inicial, pantalla de bloqueo o la app.
// La app (y con ella la base cifrada) solo se monta con la bóveda abierta.
export function VaultGate({ children }: { children: (session: Session) => ReactNode }) {
  const { state, lock } = useVault();
  const bump = useAutoLock(state.status === 'unlocked', lock);

  let content: ReactNode = null;
  if (state.status === 'setup') content = <SetupScreen />;
  if (state.status === 'locked') {
    content = (
      <UnlockScreen
        record={state.record}
        biometricEnabled={state.biometricEnabled}
        notice={state.notice}
      />
    );
  }
  if (state.status === 'unlocked') content = children(state.session);

  return (
    <View style={styles.root} onTouchStart={bump}>
      {content}
      <PrivacyCover />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
