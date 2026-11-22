import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

// Ejecuta `load` cada vez que la pantalla gana el foco, para ver cambios hechos en otras pantallas.
// `reload()` fuerza una nueva consulta sin cambiar de pantalla.
export function useFocusedQuery<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void version; // cambia para forzar una nueva consulta
      load()
        .then((result) => {
          if (active) setData(result);
        })
        .catch((error: unknown) => console.error('Error al consultar la base local', error))
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [load, version]),
  );

  return { data, loading, reload };
}
