import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Kipo } from './kipo/kipo';
import type { KipoMood } from './kipo/kipo-types';
import { AppText } from './text';

type Props = { title: string; message?: string; mood?: KipoMood; children?: ReactNode };

export function EmptyState({ title, message, mood = 'feliz', children }: Props) {
  return (
    <View style={styles.container}>
      <Kipo mood={mood} size={110} />
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText color="textMuted" align="center">
          {message}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, padding: 32 },
});
