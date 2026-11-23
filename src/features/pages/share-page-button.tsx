import { Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { useSession } from '@/features/lock/vault-context';
import { sharePage } from '@/files/share-page';
import type { DocumentPage } from '@/types/page';
import { useFeedback } from '@/ui/feedback';
import { IconButton } from '@/ui/icon-button';

// Botón "Compartir" del visor. Avisa antes, porque la página sale de Kipo sin cifrar.
export function SharePageButton({ page, color }: { page: DocumentPage; color?: string }) {
  const { keys } = useSession();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState(false);

  const share = async () => {
    const ok = await confirm({
      title: '¿Compartir esta página?',
      message: 'Sale de Kipo sin cifrar: quien la reciba podrá verla y guardarla.',
      confirmLabel: 'Compartir',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await sharePage(keys.fileKey, page, 'la página');
    } catch (error) {
      console.error('No se pudo compartir', error);
      toast('No se pudo compartir la página', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (busy) return <ActivityIndicator color={color} />;
  return (
    <IconButton
      icon={Share2}
      accessibilityLabel="Compartir página"
      tone="surface"
      onPress={() => void share()}
    />
  );
}
