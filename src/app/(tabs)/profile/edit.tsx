import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';

export default function EditProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [email, setEmail] = useState('');
  const [initials, setInitials] = useState('?');

  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'Male',
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          gender: profile.gender || 'Male',
        });
      }
      const displayStr = profile?.full_name || user.email || '?';
      const parts = displayStr.split(/[ .@]/);
      setInitials(parts.map((p: string) => p[0]?.toUpperCase()).join('').slice(0, 2));
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').upsert({
      id: user.id,
      full_name: formData.full_name,
      gender: formData.gender,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } else {
      router.navigate('/profile');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all your data, circles, and reading progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your account and all data will be permanently removed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete it',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      await supabase.from('user_profiles').delete().eq('id', user.id);
                      await supabase.from('circle_members').delete().eq('user_id', user.id);
                      await supabase.from('reading_progress').delete().eq('user_id', user.id);
                      await supabase.from('hifz_progress').delete().eq('user_id', user.id);
                      await supabase.auth.signOut();
                      router.navigate('/');
                    } catch {
                      Alert.alert('Error', 'Failed to delete account. Please contact support.');
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Profile',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDark ? colors.background : '#F7F8FA' },
          headerTitleStyle: { fontFamily: Fonts.sansBold, fontSize: 16, color: colors.text },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.navigate('/profile')} style={{ padding: 8, marginLeft: -8 }}>
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Basic Detail</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(t) => setFormData(p => ({ ...p, full_name: t }))}
            placeholder="e.g. Abdullah Al-Rashid"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, formData.gender === 'Male' && styles.genderBtnActive]}
              onPress={() => setFormData(p => ({ ...p, gender: 'Male' }))}
            >
              <View style={[styles.radio, formData.gender === 'Male' && styles.radioActive]} />
              <Text style={styles.genderText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, formData.gender === 'Female' && styles.genderBtnActive]}
              onPress={() => setFormData(p => ({ ...p, gender: 'Female' }))}
            >
              <View style={[styles.radio, formData.gender === 'Female' && styles.radioActive]} />
              <Text style={styles.genderText}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.surface : '#F1F1F1', color: colors.textTertiary }]}
            value={email}
            editable={false}
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color="#E53935" />
          ) : (
            <>
              <Trash2 size={16} color="#E53935" />
              <Text style={styles.deleteBtnText}>Delete My Account</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: isDark ? colors.background : '#F7F8FA' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: {
    padding: 4, borderRadius: 50,
    backgroundColor: isDark ? colors.background : '#F7F8FA',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Fonts.display, fontSize: 32, color: '#fff' },
  sectionTitle: { fontFamily: Fonts.sansBold, fontSize: 16, color: colors.text, marginBottom: 16, marginTop: 8 },
  inputGroup: { marginBottom: 20 },
  label: { fontFamily: Fonts.sansMedium, fontSize: 13, color: colors.textTertiary, marginBottom: 8 },
  input: {
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    borderRadius: 12, borderWidth: 1,
    borderColor: isDark ? colors.border : '#E5E5E5',
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: Fonts.sansMedium, fontSize: 15, color: colors.text,
  },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    borderWidth: 1, borderColor: isDark ? colors.border : '#E5E5E5',
    borderRadius: 12, paddingVertical: 14,
  },
  genderBtnActive: { borderColor: colors.primary + '80' },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#ccc' },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary, borderWidth: 4 },
  genderText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: colors.text },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 20,
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: { fontFamily: Fonts.sansBold, fontSize: 16, color: '#fff' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 16, borderRadius: 30,
    borderWidth: 1.5, borderColor: '#E5393540', backgroundColor: '#E5393508',
  },
  deleteBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: '#E53935' },
});
