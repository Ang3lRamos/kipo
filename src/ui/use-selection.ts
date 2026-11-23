import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

// Selección de varios elementos de una lista: se entra manteniendo presionado uno y se sale
// con "Cancelar", con el botón atrás de Android o al quedar sin nada marcado.
export type Selection = {
  active: boolean;
  ids: Set<string>;
  toggle: (id: string) => void;
  setAll: (ids: string[]) => void;
  clear: () => void;
};

export function useSelection(): Selection {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const active = ids.size > 0;

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const setAll = useCallback((all: string[]) => setIds(new Set(all)), []);
  const clear = useCallback(() => setIds(new Set()), []);

  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      clear();
      return true;
    });
    return () => sub.remove();
  }, [active, clear]);

  return useMemo(
    () => ({ active, ids, toggle, setAll, clear }),
    [active, ids, toggle, setAll, clear],
  );
}
