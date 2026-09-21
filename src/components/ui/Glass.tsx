import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface GlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Left green border highlight */
  highlight?: boolean;
}

/**
 * Replaced the complex Liquid Glass with a solid card design
 * per user request to match the stark Black/White + Green CSS theme.
 */
export function Glass({
  children,
  style,
  highlight = false,
}: GlassProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: highlight ? colors.primary : colors.border,
          borderLeftWidth: highlight ? 4 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 6, // Match border-radius: 6px from user CSS
    padding: 24, // Match padding: 1.5rem (24px) from user CSS
  },
});
