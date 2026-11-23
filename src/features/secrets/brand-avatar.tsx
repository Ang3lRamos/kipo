import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { brandForeground, brandText, findBrand } from '@/secrets/brands';
import type { SecretData } from '@/types/secret';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

import { kindInfo } from './kinds';

type Props = { title: string; data: SecretData; size: number };

// Logo del servicio (incluido en la app, nunca descargado). Si no hay logo para ese servicio:
// la inicial del nombre sobre el color del tipo de clave.
export function BrandAvatar({ title, data, size }: Props) {
  const theme = useTheme();
  const brand = findBrand(brandText(title, data));
  const radius = theme.radius.md;

  if (brand) {
    const glyph = Math.round(size * 0.52);
    return (
      <View
        accessible={false}
        style={[
          styles.box,
          { width: size, height: size, borderRadius: radius, backgroundColor: brand.hex },
        ]}
      >
        <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
          <Path d={brand.path} fill={brandForeground(brand.hex)} />
        </Svg>
      </View>
    );
  }

  const tint = theme.colors.categories[kindInfo[data.kind].tint];
  const initial = title.trim().charAt(0).toUpperCase() || '•';
  return (
    <View
      accessible={false}
      style={[
        styles.box,
        { width: size, height: size, borderRadius: radius, backgroundColor: tint.bg },
      ]}
    >
      <AppText variant="h3" color={tint.text} style={{ fontSize: Math.round(size * 0.42) }}>
        {initial}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
