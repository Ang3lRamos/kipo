import { StyleSheet, View } from 'react-native';

import { categoryInfo } from '@/features/documents/categories';
import { formatDate } from '@/features/documents/dates';
import { hasSuggestion, type Suggestion } from '@/ocr/suggest';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Kipo } from '@/ui/kipo/kipo';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

type Props = {
  reading: boolean;
  suggestion: Suggestion;
  onUse: () => void;
  onDismiss: () => void;
};

function describe(s: Suggestion): string[] {
  const lines: string[] = [];
  if (s.title) lines.push(s.title);
  if (s.category) lines.push(`Categoría: ${categoryInfo[s.category].label}`);
  if (s.expiresAt) lines.push(`Vence: ${formatDate(s.expiresAt)}`);
  if (s.issuedAt) lines.push(`Expedición: ${formatDate(s.issuedAt)}`);
  return lines;
}

// Banner de sugerencias del OCR en "Nuevo documento": Kipo buscando mientras lee y luego
// lo que encontró, con "Usar" para llenar el formulario.
export function SuggestionBanner({ reading, suggestion, onUse, onDismiss }: Props) {
  const theme = useTheme();
  const tone = theme.colors.location;
  const found = hasSuggestion(suggestion);
  if (!reading && !found) return null;

  return (
    <Card tint={tone.bg}>
      <View style={styles.row}>
        <Kipo mood={reading ? 'buscando' : 'feliz'} size={56} />
        <View style={styles.text}>
          <AppText variant="h3" color={tone.text}>
            {reading ? 'Leyendo el documento…' : 'Encontré esto'}
          </AppText>
          {reading ? (
            <AppText variant="small" color={tone.text}>
              El texto se lee en tu teléfono; no sale de aquí.
            </AppText>
          ) : (
            describe(suggestion).map((line) => (
              <AppText key={line} variant="small" color={tone.text}>
                {line}
              </AppText>
            ))
          )}
        </View>
      </View>
      {!reading && found ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button label="Usar" onPress={onUse} />
          </View>
          <View style={styles.action}>
            <Button label="Ignorar" variant="ghost" onPress={onDismiss} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  text: { flex: 1, gap: 2 },
});
