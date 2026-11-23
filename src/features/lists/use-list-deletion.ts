import { useCallback, useMemo, useState } from 'react';

import { useSelection } from '@/ui/use-selection';

import { useDelete } from './use-delete';

// Selección múltiple + borrado de una lista. Lo borrado desaparece al instante (con su
// animación de salida) sin esperar a que la consulta vuelva.
export function useListDeletion<T extends { id: string }>(
  kind: 'documents' | 'secrets',
  items: T[],
  reload: () => void,
) {
  const selection = useSelection();
  const remove = useDelete(kind);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => (hidden.size === 0 ? items : items.filter((item) => !hidden.has(item.id))),
    [items, hidden],
  );

  const deleteSelected = useCallback(async () => {
    const ids = [...selection.ids];
    if (!(await remove(ids))) return;
    setHidden((current) => new Set([...current, ...ids]));
    selection.clear();
    reload();
  }, [selection, remove, reload]);

  return { selection, visible, deleteSelected };
}
