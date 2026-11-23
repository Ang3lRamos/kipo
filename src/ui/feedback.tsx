import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmDialog, type ConfirmOptions } from './confirm-dialog';
import { Toast, type ToastMessage } from './toast';

// Confirmaciones y avisos de la app, con el estilo de Kipo:
//   const ok = await confirm({ title: 'Eliminar', confirmLabel: 'Eliminar', destructive: true });
//   toast('Eliminado');
type Feedback = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (text: string, tone?: ToastMessage['tone']) => void;
};

const Context = createContext<Feedback | null>(null);
const toastMs = 2600;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    resolver.current?.(false); // un diálogo nuevo cancela el anterior
    setDialog(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setDialog(null);
  }, []);

  const toast = useCallback((text: string, tone: ToastMessage['tone'] = 'ok') => {
    if (timer.current) clearTimeout(timer.current);
    setMessage({ id: Date.now(), text, tone });
    timer.current = setTimeout(() => setMessage(null), toastMs);
  }, []);

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);
  return (
    <Context.Provider value={value}>
      <View style={styles.root}>
        {children}
        <Toast message={message} />
      </View>
      <ConfirmDialog options={dialog} onAnswer={answer} />
    </Context.Provider>
  );
}

export function useFeedback(): Feedback {
  const value = useContext(Context);
  if (!value) throw new Error('useFeedback debe usarse dentro de FeedbackProvider');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
