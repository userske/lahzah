/**
 * Motion — behaviour, not animation.
 *
 * A fixed-duration curve cannot answer new input. A spring can: new input just
 * changes the target and the motion stays continuous. Everything a finger can
 * touch animates on a spring, from its current on-screen value.
 *
 * Apple describes springs with two designer-facing numbers rather than the
 * mass/stiffness/damping triplet:
 *
 *   dampingRatio — overshoot. 1.0 settles with no bounce; below 1.0 oscillates.
 *   response     — how quickly the value reaches its target, in seconds.
 *
 * Reanimated's duration + dampingRatio form maps onto those directly.
 * Bounce is earned, never default: overshoot belongs to motion the user's own
 * gesture threw, not to a menu that merely appeared.
 */

import type { WithSpringConfig } from 'react-native-reanimated';

/** Critically damped. The house default for anything that simply moves. */
export const Move: WithSpringConfig = { duration: 400, dampingRatio: 1 };

/** Snappier critical damping for press feedback, which must feel immediate. */
export const Press: WithSpringConfig = { duration: 220, dampingRatio: 1 };

/** Rotation carries a little overshoot in Apple's own table. */
export const Rotate: WithSpringConfig = { duration: 400, dampingRatio: 0.8 };

/** Drawers and sheets: gesture-thrown, so bounce is earned. */
export const Sheet: WithSpringConfig = { duration: 300, dampingRatio: 0.8 };

/** A flick that was released with real velocity. */
export const Momentum: WithSpringConfig = { duration: 400, dampingRatio: 0.8 };

/** Reduced motion: no travel worth speaking of, just a settle. */
export const Still: WithSpringConfig = { duration: 1, dampingRatio: 1 };

/**
 * Where a flick is going, not where the finger left.
 *
 * Exponential decay, matching the projection in Apple's Designing Fluid
 * Interfaces sample — deliberately not the textbook v²/2a form, which
 * decelerates wrongly for this feel. Snap to the target nearest the result.
 *
 * @param velocity px/s at release
 * @param decelerationRate 0.998 for normal scroll feel, 0.99 for snappier
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary.
 *
 * A hard stop reads as frozen. Continuous resistance reads as responsive with
 * nothing further to give — the further past the edge, the less the element
 * follows the finger.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Pick the snap point nearest a projected landing position.
 * Decide with the projection, not the release point.
 */
export function nearestSnap(projected: number, snapPoints: readonly number[]): number {
  'worklet';
  let best = snapPoints[0];
  let bestDistance = Math.abs(projected - best);
  for (let i = 1; i < snapPoints.length; i++) {
    const d = Math.abs(projected - snapPoints[i]);
    if (d < bestDistance) {
      best = snapPoints[i];
      bestDistance = d;
    }
  }
  return best;
}
