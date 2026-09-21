# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

Busy adult Muslims building or keeping a daily Quran reading and memorization practice. They open the app in the gaps of a day — before Fajr, in a parked car, at a desk over lunch, in bed with the lights off — usually one-handed, often interrupted, frequently in the dark. A secondary context is group use: members of a Khatm circle or a 1:1 accountability pairing checking on shared progress.

## Product Purpose

Make Quran reading and memorization a continuous, recoverable habit for people who do not have ideal conditions. Opening the app for thirty seconds should feel like a complete task. Missing a day is something the user recovers from gently rather than a failure state. Success is returning and resuming after a lapse, not volume read.

## Positioning

Three mechanisms that a neighboring Quran app could not truthfully claim as a set:

- Memorization begins inside reading — marking a verse "difficult" enters it into spaced repetition with no mode switch.
- The app listens. Fluency Mode corrects word-by-word pronunciation with the text visible; Tahfidh Test Mode catches deviations, hesitations, and skipped words from memory alone.
- Social progress is aggregate and never ranked. Circles claim portions of a Khatm, streaks are collective, presence is anonymous. No leaderboards.

## Operating Context

Five top-level sections: Home (Today), Quran (browse and reader), Prayers, Mosques, Community. Profile and Utilities are reached outside the tab bar. Utilities carries Qibla, the Duas library, a Zakat calculator, and Moon sighting on a single screen. The reader carries audio recitation, translation / transliteration / word-by-word toggles, tajweed colouring, Hifz marking, and live circle reading sessions.

## Capabilities and Constraints

Built and wired to real data: Today feed (hadith, name of the day, ayah, dua), streak with per-day reading history, continue-reading position, prayer times with countdown, Hijri date, mosque finder on a map, circle activity, reader with chapter audio, surah browse, profile, utilities, Google auth.

Specified but with no dedicated surface yet:

- Hifz / spaced repetition — `useHifz` is called only from inside the reader.
- Digital Listener — `quranAiApi` and `useAudioRecorder` are wired into the reader with no designed flow for recording, correction feedback, or test mode.
- Khatm Circles — folded into a single 779-line messages screen.

Data sources: Quran Foundation API, UmmahAPI, Quran AI MCP server, Supabase (Postgres, Auth, RLS, Edge Functions). Stack is Expo / React Native / expo-router, already established. iOS-first with one design language; Android runs the same language rather than Material.

## Brand Commitments

- Name "Lahzah" (لحظة, "a moment") and the ✦ mark — locked.
- Tagline "A moment with the Quran".
- Accent green `#6a994e` — locked.
- Typeface trio: Syne (display), Inter (body and UI), DM Mono (numerals) — locked. None of the three has Arabic glyph coverage, so a Quranic Arabic face is an addition this lock does not cover and must still be chosen.
- No leaderboards, no ranking of one person against another, no guilt mechanics.

## Evidence on Hand

API integrations are real, not mock. Content volumes available through UmmahAPI: 36,000+ hadiths across 10 collections with grading, the 99 names, 126 duas across 27 categories, 22 prayer calculation methods. Assets on disk: `assets/images/mosque_pastel_bg.jpg`, `src/assets/premium_quran_3d.jpg`.

No testimonials, install counts, ratings, reviews, pricing, or launch date have been established. Future work must not fabricate them.

## Product Principles

1. Thirty seconds is a complete session — the app must be finishable, not merely openable.
2. Recovery over preservation — a broken streak is resumable and never punished.
3. Memorization is continuous with reading, never a separate mode.
4. Group progress is aggregate; a person is never ranked against another person.
5. Content carries its provenance — collection, number, and grade stay visible.

## Accessibility & Inclusion

Dynamic Type and Dark Mode are first-class, following the iOS-first platform decision. Bilingual rendering — RTL Arabic and LTR English in the same view, at different optical sizes — is a structural constraint of the reader and the feed, not a localization afterthought.
