import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { Compass, Book, DollarSign, Moon } from 'lucide-react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import {
  fetchQiblaDirection,
  fetchDuaCategories,
  fetchDuas,
  fetchMoonPhase,
  calculateZakat,
} from '../services/ummahApi';
import { useAppTheme } from '../hooks/useAppTheme';

type UtilityTab = 'qibla' | 'duas' | 'zakat' | 'moon';

// Categories are fetched dynamically from R2.

// ─── Qibla Compass Widget ─────────────────────────────────────────────────────
function QiblaWidget({ colors }: { colors: any }) {
  const [qibla, setQibla] = useState<{ direction: number; compass_direction: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [heading, setHeading] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setErr('Location needed for Qibla direction.'); setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const data = await fetchQiblaDirection({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      if (data) setQibla({ direction: data.qibla_direction, compass_direction: data.compass_bearing }); else setErr('Could not fetch Qibla direction.');
      setLoading(false);
    })();
    
    Magnetometer.setUpdateInterval(50);
    const sub = Magnetometer.addListener(data => {
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      // Adjusting for landscape/portrait and native orientation could be complex, 
      // but standard portrait usage maps straightforwardly.
      setHeading(Math.round(angle));
    });
    
    return () => { sub.remove(); };
  }, []);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  if (err || !qibla) return <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 40 }}>{err}</Text>;

  // Simple compass-style display
  // Qibla direction is absolute from North. Heading is the device's rotation from North.
  const deg = qibla.direction;
  const compassRotation = 360 - heading; 
  const needleRotation = compassRotation + deg;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      {/* Compass ring */}
      <View style={{
        width: 200, height: 200, borderRadius: 100,
        borderWidth: 2, borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}>
        <View style={{
          width: 4, height: 80, borderRadius: 2,
          backgroundColor: colors.primary,
          transform: [{ rotate: `${needleRotation}deg` }],
          position: 'absolute',
          top: 20,
        }} />
        <View style={{
          width: 4, height: 50, borderRadius: 2,
          backgroundColor: colors.skeleton,
          transform: [{ rotate: `${needleRotation + 180}deg` }],
          position: 'absolute',
          top: 80,
        }} />
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, zIndex: 2 }} />
      </View>
      <View style={{ marginTop: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primary }}>{Math.round(deg)}°</Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginTop: 4 }}>
          {qibla.compass_direction} from your location
        </Text>
        <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 8 }}>
          Kaaba, Makkah al-Mukarramah
        </Text>
      </View>
    </View>
  );
}

// ─── Duas Library ─────────────────────────────────────────────────────────────
function DuasWidget({ colors }: { colors: any }) {
  const [categories, setCategories] = useState<{ id: string; name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('morning');
  const [duas, setDuas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchDuaCategories().then(cats => {
      if (cats && cats.length > 0) {
        setCategories(cats);
        // Default to the first category if 'morning' isn't there, else keep 'morning'
      }
    });
  }, []);

  const load = useCallback(async (cat: string) => {
    setLoading(true);
    setDuas([]);
    const data = await fetchDuas(cat);
    setDuas(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(selectedCategory); }, [selectedCategory]);

  return (
    <View style={{ flex: 1 }}>
      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={{
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
              }}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: selectedCategory === cat.id ? '#fff' : colors.textSecondary,
              }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : duas.length === 0 ? (
        <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 40 }}>
          No duas available in this category.
        </Text>
      ) : (
        duas.map((dua, idx) => (
          <TouchableOpacity
            key={idx}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16, padding: 16, marginBottom: 12,
              borderWidth: 1, borderColor: colors.border,
            }}
            onPress={() => setExpanded(expanded === String(idx) ? null : String(idx))}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 20, lineHeight: 36, textAlign: 'right', color: colors.text, marginBottom: 8 }}>
              {dua.arabic}
            </Text>
            {expanded === String(idx) && (
              <>
                <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 10 }} />
                <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 6 }}>
                  {dua.transliteration}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary }}>
                  {dua.translation}
                </Text>
                {dua.reference && (
                  <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 8, fontWeight: '600' }}>
                    — {dua.reference}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ─── Zakat Calculator ─────────────────────────────────────────────────────────
function ZakatWidget({ colors }: { colors: any }) {
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [stocks, setStocks] = useState('');
  const [business, setBusiness] = useState('');
  const [nisab, setNisab] = useState<'gold' | 'silver'>('gold');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    const payload = {
      cash: parseFloat(cash) || 0,
      gold_value: parseFloat(gold) || 0,
      silver_value: parseFloat(silver) || 0,
      stocks_value: parseFloat(stocks) || 0,
      business_value: parseFloat(business) || 0,
      nisab_type: nisab,
    };
    const data = await calculateZakat(payload);
    setResult(data);
    setLoading(false);
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    fontSize: 15, color: colors.text,
    marginBottom: 12,
  };
  const labelStyle = { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary, marginBottom: 4 };

  return (
    <View>
      <Text style={{ fontSize: 14, color: colors.textTertiary, marginBottom: 16, lineHeight: 21 }}>
        Enter your assets below to calculate your obligatory Zakat (2.5% on eligible wealth above Nisab).
      </Text>

      <Text style={labelStyle}>Cash & Bank Savings ($)</Text>
      <TextInput style={inputStyle} value={cash} onChangeText={setCash} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textTertiary} />

      <Text style={labelStyle}>Gold Value ($)</Text>
      <TextInput style={inputStyle} value={gold} onChangeText={setGold} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textTertiary} />

      <Text style={labelStyle}>Silver Value ($)</Text>
      <TextInput style={inputStyle} value={silver} onChangeText={setSilver} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textTertiary} />

      <Text style={labelStyle}>Stocks & Investments ($)</Text>
      <TextInput style={inputStyle} value={stocks} onChangeText={setStocks} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textTertiary} />

      <Text style={labelStyle}>Business Goods ($)</Text>
      <TextInput style={inputStyle} value={business} onChangeText={setBusiness} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textTertiary} />

      {/* Nisab type toggle */}
      <Text style={[labelStyle, { marginTop: 4 }]}>Nisab Threshold</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {(['gold', 'silver'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12,
              backgroundColor: nisab === type ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: nisab === type ? colors.primary : colors.border,
              alignItems: 'center',
            }}
            onPress={() => setNisab(type)}
          >
            <Text style={{ fontWeight: '700', color: nisab === type ? '#fff' : colors.textSecondary, textTransform: 'capitalize' }}>
              {type} Nisab
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 }}
        onPress={calculate}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Calculate Zakat</Text>}
      </TouchableOpacity>

      {result && (
        <View style={{ backgroundColor: colors.primaryLight, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.primary }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Zakat Due
          </Text>
          <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primary }}>
            ${(result.zakat_due ?? result.zakat ?? 0).toFixed(2)}
          </Text>
          {result.total_wealth != null && (
            <Text style={{ fontSize: 13, color: colors.primary, marginTop: 6 }}>
              Total Zakatable Wealth: ${result.total_wealth.toFixed(2)}
            </Text>
          )}
          {result.nisab_value != null && (
            <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
              Nisab Threshold: ${result.nisab_value.toFixed(2)}
            </Text>
          )}
          {result.zakat_due === 0 && (
            <Text style={{ fontSize: 13, color: colors.primary, marginTop: 8, fontStyle: 'italic' }}>
              Your wealth is below the Nisab threshold — Zakat is not obligatory this year.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Moon Sighting ────────────────────────────────────────────────────────────
function MoonWidget({ colors }: { colors: any }) {
  const [moon, setMoon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoonPhase().then((data) => { setMoon(data); setLoading(false); });
  }, []);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  if (!moon) return <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 40 }}>Moon data unavailable.</Text>;

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
      <Text style={{ fontSize: 14, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{value}</Text>
    </View>
  );

  return (
    <View>
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Moon size={80} color={colors.text} strokeWidth={1.5} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12 }}>
          {moon.phase ?? 'Unknown Phase'}
        </Text>
        {moon.illumination != null && (
          <Text style={{ fontSize: 15, color: colors.primary, marginTop: 4, fontWeight: '600' }}>
            {Math.round(moon.illumination * 100)}% illuminated
          </Text>
        )}
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
        {moon.visibility != null && <InfoRow label="Visibility" value={moon.visibility} />}
        {moon.next_new_moon && <InfoRow label="Next New Moon" value={moon.next_new_moon} />}
        {moon.next_full_moon && <InfoRow label="Next Full Moon" value={moon.next_full_moon} />}
        {moon.age != null && <InfoRow label="Moon Age" value={`${moon.age} days`} />}
        {moon.distance != null && <InfoRow label="Distance" value={`${Math.round(moon.distance).toLocaleString()} km`} />}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TABS: { key: UtilityTab; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'qibla', label: 'Qibla', Icon: Compass },
  { key: 'duas', label: 'Duas', Icon: Book },
  { key: 'zakat', label: 'Zakat', Icon: DollarSign },
  { key: 'moon', label: 'Moon', Icon: Moon },
];

export default function UtilitiesScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<UtilityTab>('qibla');

  const smoothEntry = FadeInDown.duration(400).easing(Easing.out(Easing.quad));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Islamic Utilities</Text>
        <Text style={styles.headerSub}>Tools for your daily practice</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <tab.Icon size={18} color={activeTab === tab.key ? '#fff' : colors.textTertiary} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View key={activeTab} entering={smoothEntry}>
          {activeTab === 'qibla' && <QiblaWidget colors={colors} />}
          {activeTab === 'duas' && <DuasWidget colors={colors} />}
          {activeTab === 'zakat' && <ZakatWidget colors={colors} />}
          {activeTab === 'moon' && <MoonWidget colors={colors} />}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20, paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: colors.textTertiary, marginTop: 1 },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 16, paddingVertical: 12, gap: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tab: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 10, borderRadius: 12,
      backgroundColor: colors.skeleton,
    },
    tabActive: { backgroundColor: colors.primary },
    tabLabel: { fontSize: 12, fontWeight: '700', color: colors.textTertiary },
    tabLabelActive: { color: '#fff' },
    content: { padding: 16, paddingBottom: 140 },
  });
