import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

export const fontConfig = {
  playfair: {
    regular: 'PlayfairDisplay_400Regular',
    bold: 'PlayfairDisplay_700Bold',
  },
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  jetbrainsMono: {
    regular: 'JetBrainsMono_400Regular',
    bold: 'JetBrainsMono_700Bold',
  },
} as const;

export const fontLoadMap = {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} as const;

export function useLoadFonts(): { loaded: boolean; error: boolean } {
  const [loaded, error] = useFonts(fontLoadMap);
  return { loaded, error: !!error };
}
