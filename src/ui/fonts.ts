import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';

// Los nombres coinciden con tokens.font de themes.ts.
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceGrotesk_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  if (error) console.warn('No se cargaron las fuentes; se usan las del sistema', error);
  return loaded || error !== null;
}
