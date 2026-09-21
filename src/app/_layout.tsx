/*
 * DIRECTION CONTRACT — Folio
 *
 * THESIS: One subject across five stages at one fixed scale; progress reads by
 *   comparison, never by score. Refuses the emerald-and-gold arabesque card stack
 *   and equally its stark black/white minimal opposite.
 * OWN-WORLD: Plate-cream or night-ink ground, hairline sepia rules, two-centred
 *   mihrab arches enclosing jali lattice, engraved serif over Inter and DM Mono,
 *   the locked green as the only action colour, scarlet reserved for overdue.
 * STORY: A busy adult opens in the dark, sees where the day stands, resumes in one tap.
 * FIRST VIEWPORT: Five arch plates on one shared baseline struck by a dotted
 *   registration rule, name and time beneath each, then a hairline band carrying
 *   the next prayer in italic serif.
 * FORM: Botanical Folio — user-pinned challenger over assigned index 4; seed key 09af0df7.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
 *   review, the verdict, and DESIGN.md
 */

import { registerGlobals } from '@livekit/react-native';
registerGlobals();

import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Syne_400Regular,
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import {
  SourceSerif4_400Regular,
  SourceSerif4_400Regular_Italic,
  SourceSerif4_600SemiBold,
} from '@expo-google-fonts/source-serif-4';
import { FolioColors } from '../constants/folio';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useFolio } from '../hooks/useFolio';
import { AudioProvider } from '../contexts/AudioContext';
import { PreferencesProvider } from '../hooks/usePreferences';
import { isPreloadComplete, startPreload } from '../services/quranPreload';
import { QuranDataGate } from '../components/onboarding/QuranDataGate';

import { PlaybackService } from '../services/playbackService';
import TrackPlayer from 'react-native-track-player';

// Register the background audio playback service for TrackPlayer
TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  const { plate } = useFolio();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      AmiriQuran: require('../../assets/fonts/AmiriQuran.ttf'),
      SurahHeader: require('../../assets/fonts/QCF_SurahHeader_COLOR-Regular.ttf'),
      'Scheherazade New': require('../../assets/fonts/ScheherazadeNew-Regular.ttf'),
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
      Syne_400Regular,
      Syne_500Medium,
      Syne_600SemiBold,
      Syne_700Bold,
      DMMono_400Regular,
      DMMono_500Medium,
      SourceSerif4_400Regular,
      SourceSerif4_400Regular_Italic,
      SourceSerif4_600SemiBold,
    }).then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
  }, []);

  // ── Background Quran data preload ───────────────────────────────────────────
  // Fires once after fonts are loaded. The app opens normally — no gate.
  // On second+ launches the sentinel check takes <5ms and exits immediately.
  useEffect(() => {
    if (!fontsLoaded) return;
    isPreloadComplete().then(done => {
      if (!done) {
        startPreload().catch(e => console.warn('[layout] preload error:', e));
      }
    });
  }, [fontsLoaded]);

  useEffect(() => {
    // Get current session on mount — no forced redirect to /auth, screens gate themselves
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        // On successful sign-in (magic link tap or OAuth callback), navigate home.
        // TOKEN_REFRESHED and USER_UPDATED must NOT trigger navigation.
        if (event === 'SIGNED_IN') {
          router.replace('/');
        }
        // SIGNED_OUT: let profile/circles handle their own gate — no global redirect.
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // When initial auth check completes, always open home (auth is optional).
  useEffect(() => {
    if (initializing) return;
    router.replace('/');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing]);

  if (initializing || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: plate.ground }}>
        <ActivityIndicator size="large" color={plate.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <AudioProvider>
          <QuranDataGate>
            <Stack screenOptions={{ contentStyle: { backgroundColor: plate.ground } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="names" options={{ headerShown: false }} />
              <Stack.Screen
                name="utilities"
                options={{ title: 'Utilities', headerBackTitle: 'Today' }}
              />
            </Stack>
          </QuranDataGate>
        </AudioProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}
