import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export interface MotionPrefs {
  /** Replace travel with a cross-fade; drop overshoot and parallax. */
  reduceMotion: boolean;
  /** Make translucent surfaces solid rather than frosted. */
  reduceTransparency: boolean;
}

/**
 * The three accessibility signals that change how motion and material behave.
 *
 * Reduced motion does not mean no feedback — it means a gentler, non-vestibular
 * equivalent. Opacity and colour changes that aid comprehension stay.
 */
export function useMotionPrefs(): MotionPrefs {
  const reduceMotion = useReducedMotion();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then((enabled) => {
        if (active) setReduceTransparency(enabled);
      })
      .catch(() => {
        /* Platform does not report it; frosted is the safe default. */
      });

    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );

    return () => {
      active = false;
      sub?.remove();
    };
  }, []);

  return { reduceMotion, reduceTransparency };
}
