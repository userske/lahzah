/**
 * Simple module-level store for communicating the user's
 * selected surah from the browse screen to the reader screen.
 *
 * This avoids relying on URL params which are unreliable
 * for already-mounted tab screens in expo-router.
 */

let _requestedSurah: number | null = null;
let _requestedAyah: number | null = null;
let _requestedCircleId: string | null = null;

/** Browse screen calls this before navigating to the reader */
export const requestSurah = (surah: number, ayah?: number, circleId?: string) => {
  _requestedSurah = surah;
  _requestedAyah = ayah ?? null;
  _requestedCircleId = circleId ?? null;
};

/** Reader screen calls this on focus to consume the pending request */
export const consumeReaderRequest = (): { surah: number; ayah: number | null; circleId: string | null } | null => {
  if (_requestedSurah === null) return null;
  const result = { surah: _requestedSurah, ayah: _requestedAyah, circleId: _requestedCircleId };
  _requestedSurah = null;
  _requestedAyah = null;
  _requestedCircleId = null;
  return result;
};
