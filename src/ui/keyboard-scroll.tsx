import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// Contenedor para pantallas con campos de texto. En Android, con la pantalla de borde a borde
// (SDK 58), la ventana ya no se achica sola con el teclado: aquí se deja espacio para él y se
// desplaza hasta el campo activo, al abrir el teclado y al pasar de un campo a otro.

const RevealContext = createContext<() => void>(() => undefined);

// Los campos llaman a esto al recibir el foco (TextField ya lo hace).
export function useRevealFocusedInput(): () => void {
  return useContext(RevealContext);
}

const topMargin = 96; // deja visible la etiqueta del campo y un poco de contexto

type Props = { children: ReactNode; contentContainerStyle?: StyleProp<ViewStyle> };

export function KeyboardScroll({ children, contentContainerStyle }: Props) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const contentRef = useRef<ComponentRef<typeof View>>(null);

  const reveal = useCallback(() => {
    // Espera a que el teclado termine de abrir y el contenedor se acomode.
    setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput();
      const content = contentRef.current;
      if (!input || !content) return;
      input.measureLayout(
        content,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - topMargin), animated: true }),
        () => undefined,
      );
    }, 250);
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', reveal);
    return () => subscription.remove();
  }, [reveal]);

  const value = useMemo(() => reveal, [reveal]);

  return (
    <RevealContext.Provider value={value}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.grow}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* El estilo (padding, gap, centrado) va en esta vista, que es la que se mide. */}
          <View ref={contentRef} collapsable={false} style={[styles.grow, contentContainerStyle]}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RevealContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
