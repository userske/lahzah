import React from 'react';
import { StyleSheet, View, ViewProps, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFolio } from '../../hooks/useFolio';

interface AppBackgroundProps extends ViewProps {
  children: React.ReactNode;
  /**
   * When true, skips the image/gradient and renders a plain solid background.
   * Use in Mushaf mode so the page background is one uniform colour with no bleed.
   */
  solid?: boolean;
  /** The solid colour to use when `solid` is true. Defaults to '#000'. */
  solidColor?: string;
}

/** The plate the whole folio is printed on — with the circle image as a soft background. */
export function AppBackground({ children, style, solid, solidColor = '#000000', ...rest }: AppBackgroundProps) {
  const { isNight } = useFolio();

  if (solid) {
    return (
      <View style={[styles.container, { backgroundColor: solidColor }, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../../assets/images/background_image.jpg')}
      style={[styles.container, style]}
      resizeMode="cover"
      {...rest}
    >
      {/* Translucent overlay — lighter in day, heavier at night for readability */}
      <LinearGradient
        colors={
          isNight
            ? ['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.82)']
            : ['rgba(238,235,227,0.82)', 'rgba(238,235,227,0.70)', 'rgba(238,235,227,0.88)']
        }
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
