import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Mail } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/colors';
import Animated, { FadeInDown, FadeInUp, Easing } from 'react-native-reanimated';
import { AnimatedPressable } from '../components/ui/AnimatedPressable';
import { GoogleLogo } from '../components/ui/GoogleLogo';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

type AuthStep = 'entry' | 'check-email';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('entry');

  const handleContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: Linking.createURL('/'),
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Something went wrong', error.message);
    } else {
      setStep('check-email');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    // In Expo Go this generates exp://192.168.x.x:8081/--/
    // In a standalone build this generates tempapp://
    const redirectUrl = Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      Alert.alert('Google sign in failed', error.message);
      setGoogleLoading(false);
      return;
    }
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success' && result.url) {
        // Supabase puts tokens in the URL hash fragment (#), not query params
        const hashPart = result.url.split('#')[1] ?? '';
        const params = new URLSearchParams(hashPart);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token') ?? '';
        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          // Navigate home — onAuthStateChange in _layout will also fire SIGNED_IN
          router.replace('/');
        }
      }
    }
    setGoogleLoading(false);
  };

  // Smooth, elegant entry animation
  const smoothEntry = FadeInDown.duration(600).easing(Easing.out(Easing.exp));

  if (step === 'check-email') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Animated.View entering={FadeInUp.duration(500).easing(Easing.out(Easing.exp))} style={styles.checkEmailContainer}>
            <View style={{ marginBottom: 20 }}>
              <Mail size={48} color={colors.coral} />
            </View>
            <Text style={styles.checkEmailTitle}>Check your inbox</Text>
            <Text style={styles.checkEmailBody}>
              We sent a sign-in link to{'\n'}
              <Text style={styles.checkEmailAddress}>{email}</Text>
            </Text>
            <Text style={styles.checkEmailHint}>Tap the link in the email to sign in.</Text>
          </Animated.View>

          <AnimatedPressable
            style={styles.resendBtn}
            onPress={() => setStep('entry')}
            scaleTo={0.97}
          >
            <Text style={styles.resendText}>Use a different email</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Animated.View
            entering={smoothEntry.delay(50)}
            style={styles.header}
          >
            <Text style={styles.appName}>لحظة</Text>
            <Text style={styles.tagline}>A Moment with the Quran</Text>
          </Animated.View>

          <Animated.View
            entering={smoothEntry.delay(100)}
            style={styles.formContainer}
          >
            <Text style={styles.pageTitle}>Log in or sign up</Text>

            {/* Email input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="jsmith@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              {email.length > 0 && (
                <AnimatedPressable onPress={() => setEmail('')} scaleTo={0.8} style={styles.clearBtn}>
                  <AntDesign name="close-circle" size={16} color="#BDBDBD" />
                </AnimatedPressable>
              )}
            </View>

            {/* Continue button */}
            <AnimatedPressable
              style={[styles.continueBtn, loading && styles.btnDisabled]}
              onPress={handleContinue}
              disabled={loading}
              scaleTo={0.97}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueBtnText}>Continue</Text>
              )}
            </AnimatedPressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <AnimatedPressable
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              scaleTo={0.97}
            >
              {googleLoading ? (
                <ActivityIndicator color="#1f1f1f" />
              ) : (
                <View style={styles.googleContent}>
                  <GoogleLogo size={20} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </View>
              )}
            </AnimatedPressable>
          </Animated.View>

          {/* Footer */}
          <Animated.Text
            entering={FadeInDown.springify().damping(14).delay(250)}
            style={styles.footer}
          >
            Your reading is private. No data is shared without your consent.
          </Animated.Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Light grey background like Mobbin
  },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 60,
  },
  appName: {
    fontSize: 52,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    letterSpacing: -0.2,
  },

  // ── Form Container ──
  formContainer: {
    gap: 16,
    marginBottom: 40,
  },

  // ── Title ──
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.4,
  },

  // ── Input ──
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },

  // ── Continue button ──
  continueBtn: {
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerLabel: {
    fontSize: 15,
    color: '#888',
    fontWeight: '400',
  },

  // ── Google button ──
  googleBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },

  btnDisabled: { opacity: 0.55 },

  // ── Footer ──
  footer: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Check email state ──
  checkEmailContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  checkEmailIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  checkEmailTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  checkEmailBody: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  checkEmailAddress: {
    color: '#000',
    fontWeight: '600',
  },
  checkEmailHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  resendBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#fff',
    marginTop: 24,
  },
  resendText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
});
