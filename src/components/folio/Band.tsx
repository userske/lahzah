import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rule, Step, label as labelStyle } from '../../constants/folio';
import { useFolio } from '../../hooks/useFolio';

interface BandProps {
  /** Register division, set on the rule itself — a caption for a division, not a heading's eyebrow. */
  title: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}

/**
 * A division in the register.
 *
 * The label sits on the rule and the rule runs out to the margin, the way a
 * ledger divides its sections. This is deliberately not a heading with a label
 * stacked above it.
 */
export function Band({ title, children, trailing }: BandProps) {
  const { plate } = useFolio();

  return (
    <View style={styles.band}>
      <View style={styles.division}>
        <Text style={[labelStyle, styles.title, { color: plate.graphite }]}>{title}</Text>
        <View style={[styles.rule, { backgroundColor: plate.rule }]} />
        {trailing}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    marginBottom: Step.bandGap,
  },
  division: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Step.base,
    paddingHorizontal: Step.margin,
    marginBottom: Step.band,
  },
  title: {
    fontSize: 10,
    letterSpacing: 1.3,
  },
  rule: {
    flex: 1,
    height: Rule,
  },
});
