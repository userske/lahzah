import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Keyboard,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { FontAwesome5 } from '@expo/vector-icons';
import { Map, Globe, Layers, Navigation, ExternalLink, X, Search, RefreshCw, MapPin, AlertCircle, Truck } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import MapView, { Marker, MapType, Polyline } from 'react-native-maps';

import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';

interface Mosque {
  id: string;
  name: string;
  distance: number;
  lat: number;
  lon: number;
  address?: string;
  rating?: number;
}

// ─── Google Places API (New) v1 ──────────────────────────────────────────────
// Docs: https://developers.google.com/maps/documentation/places/web-service
const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

async function fetchNearbyMosques(lat: number, lon: number, radius = 5000): Promise<Mosque[]> {
  if (!PLACES_KEY || PLACES_KEY === 'YOUR_KEY_HERE') {
    throw new Error('Google Places API key is not configured. Add it to your .env file.');
  }

  const toRad = (d: number) => (d * Math.PI) / 180;
  const haversine = (lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = toRad(lat2 - lat);
    const dLon = toRad(lon2 - lon);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let data: any;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=mosque&key=${PLACES_KEY}`,
      { signal: controller.signal }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Places API error (${res.status}): ${errBody}`);
    }
    data = await res.json();
  } finally {
    clearTimeout(timer);
  }

  const mosqueRegex = /\b(masjid(ul)?|msikiti(ni)?|misikiti(ni)?|mskiti|mosque|camii?|mechet|mezquita|mosquée|musallah|musholla|jama\smasjid|surau)\b/i;

  const results: Mosque[] = [];
  if (data.results) {
    for (const place of data.results) {
      const elLat = place.geometry?.location?.lat;
      const elLon = place.geometry?.location?.lng;
      if (!elLat || !elLon) continue;
      
      const placeName = place.name ?? 'Unnamed Mosque';
      
      // Secondary defense: Filter out false positives (e.g. non-Islamic places of worship)
      if (!mosqueRegex.test(placeName)) {
         // Also check types array if it explicitly has 'mosque' to avoid filtering out valid Islamic centers without 'mosque' in name
         const types = place.types || [];
         if (!types.includes('mosque')) {
             continue;
         }
      }
      
      results.push({
        id: place.place_id ?? String(Math.random()),
        name: placeName,
        lat: elLat,
        lon: elLon,
        distance: haversine(elLat, elLon),
        address: place.vicinity || place.formatted_address,
        rating: place.rating,
      });
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
}


// ─── Bearing Calculation ─────────────────────────────────────────────────────
function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const startLatRad = toRad(startLat);
  const destLatRad = toRad(destLat);
  const dLngRad = toRad(destLng - startLng);

  const y = Math.sin(dLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(dLngRad);

  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

// ─────────────────────────────────────────────────────────────────────────────
// Polyline Decoder for Google Maps Directions API
// ─────────────────────────────────────────────────────────────────────────────
function decodePolyline(t: string, precision = 5) {
  let index = 0,
      lat = 0,
      lng = 0,
      coordinates = [],
      shift = 0,
      result = 0,
      byte = null,
      latitude_change,
      longitude_change,
      factor = Math.pow(10, precision);

  while (index < t.length) {
      byte = null;
      shift = 0;
      result = 0;
      do {
          byte = t.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
      } while (byte >= 0x20);
      latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      shift = result = 0;
      do {
          byte = t.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
      } while (byte >= 0x20);
      longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += latitude_change;
      lng += longitude_change;
      coordinates.push({ latitude: lat / factor, longitude: lng / factor });
  }
  return coordinates;
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps-style custom mosque pin marker
// ─────────────────────────────────────────────────────────────────────────────
function MosquePin({ color = '#111', size = 42, active = false }: { color?: string; size?: number; active?: boolean }) {
  const pinW = size;
  const pinH = size * 1.33; // Taller for the sharp tip
  return (
    <View style={{ width: pinW, height: pinH, alignItems: 'center' }}>
      <Svg width={pinW} height={pinH} viewBox="0 0 30 40" style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="shadow" cx="50%" cy="35%" r="60%">
            <Stop offset="0%" stopColor="#000" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {/* Teardrop path (Glassmorphic) */}
        <Path
          d="M15 0 C6.716 0 0 6.716 0 15 C0 23.284 15 40 15 40 C15 40 30 23.284 30 15 C30 6.716 23.284 0 15 0 Z"
          fill={active ? color : 'rgba(255, 255, 255, 0.65)'}
          stroke={active ? 'transparent' : 'rgba(255, 255, 255, 0.5)'}
          strokeWidth="1.5"
        />
        {/* Inner subtle shadow highlight when active */}
        {active && (
          <Path
            d="M15 0 C6.716 0 0 6.716 0 15 C0 23.284 15 40 15 40 C15 40 30 23.284 30 15 C30 6.716 23.284 0 15 0 Z"
            fill="url(#shadow)"
          />
        )}
      </Svg>
      {/* Icon perfectly centered inside the top round section of the teardrop */}
      <View style={{ width: pinW, height: pinW, alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome5
          name="mosque"
          size={size * 0.45}
          color={active ? '#fff' : '#111'}
          style={{ marginTop: 2 }} // optical adjustment
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MosqueFinderScreen() {
  const { colors, isDark } = useAppTheme();
  const accentColor = isDark ? '#fff' : '#111';
  const accentBgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapType, setMapType] = useState<MapType>('satellite');
  const mapRef = useRef<MapView>(null);
  // Navigation State
  const [navigatingMosque, setNavigatingMosque] = useState<Mosque | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [liveDistance, setLiveDistance] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'WALK'>('DRIVE');
  const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);
  const routeCoordsRef = useRef<{latitude: number; longitude: number}[]>([]);
  const headingRef = useRef(0);
  const roseAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Search Bar State
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TTS Turn-by-Turn State
  const routeStepsRef = useRef<any[]>([]);
  const currentStepIndexRef = useRef(0);
  const lastSpokenIndex = useRef(-1);
  const MAP_TYPE_CYCLE: MapType[] = ['standard', 'satellite', 'hybrid'];
  const MAP_TYPE_ICONS: Record<string, React.ComponentType<any>> = { standard: Map, satellite: Globe, hybrid: Layers };
  const MAP_TYPE_LABELS: Record<string, string> = { standard: 'Map', satellite: 'Satellite', hybrid: 'Hybrid' };

  const cycleMapType = () => {
    setMapType((prev) => {
      const idx = MAP_TYPE_CYCLE.indexOf(prev);
      return MAP_TYPE_CYCLE[(idx + 1) % MAP_TYPE_CYCLE.length];
    });
  };

  const fetchMosques = async (searchLat?: number, searchLon?: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (searchLat === undefined || searchLon === undefined) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission is required to find nearby mosques.');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        searchLat = location.coords.latitude;
        searchLon = location.coords.longitude;
        setUserLocation({ lat: searchLat, lon: searchLon });
      }

      // Only pan the map if we are NOT currently navigating
      if (mapRef.current && !navigatingMosque) {
        mapRef.current.animateToRegion({
          latitude: searchLat,
          longitude: searchLon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      const results = await fetchNearbyMosques(searchLat, searchLon);
      setMosques(results);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch mosques. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMosques();
  }, []);

  // Navigation Sensors — re-runs when mosque or travelMode changes
  useEffect(() => {
    if (!navigatingMosque) {
      pulseAnim.setValue(1);
      return;
    }
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    let posSub: Location.LocationSubscription | null = null;
    let headSub: Location.LocationSubscription | null = null;
    let isActive = true;

    let offRouteTicks = 0;

    const fetchRoute = async (startLat: number, startLon: number, isReroute = false) => {
      try {
        const res = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': PLACES_KEY,
            'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.legs.steps',
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: startLat, longitude: startLon } } },
            destination: { location: { latLng: { latitude: navigatingMosque.lat, longitude: navigatingMosque.lon } } },
            travelMode: travelMode === 'WALK' ? 'WALK' : 'DRIVE',
          }),
        });
        const json = await res.json();
        if (!isActive) return;

        if (json.routes && json.routes.length > 0) {
          const polylineStr = json.routes[0].polyline.encodedPolyline;
          const decoded = decodePolyline(polylineStr);
          const newPath = [
            { latitude: startLat, longitude: startLon },
            ...decoded,
            { latitude: navigatingMosque.lat, longitude: navigatingMosque.lon },
          ];
          setRouteCoordinates(newPath);
          routeCoordsRef.current = newPath;

          if (json.routes[0].legs?.length > 0) {
            routeStepsRef.current = json.routes[0].legs[0].steps || [];
            currentStepIndexRef.current = 0;
            lastSpokenIndex.current = -1;

            const firstStep = routeStepsRef.current[0];
            if (firstStep?.navigationInstruction?.instructions) {
              const cleanText = firstStep.navigationInstruction.instructions.replace(/<\/?[^>]+(>|$)/g, '');
              if (!isReroute) {
                Speech.speak(cleanText);
              }
              setCurrentInstruction(cleanText);
              lastSpokenIndex.current = 0;
            }
          }
        }
      } catch (err) {
      }
    };

    const startNav = async () => {
      // ── Step 0: Get a FRESH GPS position right now (don't rely on stale state) ──
      let startLat: number;
      let startLon: number;

      try {
        const freshLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        startLat = freshLoc.coords.latitude;
        startLon = freshLoc.coords.longitude;
        setUserLocation({ lat: startLat, lon: startLon });
      } catch {
        // Fall back to last known state if GPS fails
        if (!userLocation) return;
        startLat = userLocation.lat;
        startLon = userLocation.lon;
      }

      if (!isActive) return;

      // ── Step 1: Immediately snap camera to 3D navigation view ──
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: { latitude: startLat, longitude: startLon },
          pitch: 60,
          heading: headingRef.current,
          zoom: 19,
          altitude: 100,
        }, { duration: 600 });
      }

      // ── Step 2: Fetch the route using the fresh position ──
      await fetchRoute(startLat, startLon, false);

      // ── Step 3: Watch live position ──
      posSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1500, distanceInterval: 5 },
        (loc) => {
          if (!isActive) return;
          const { latitude, longitude } = loc.coords;
          setUserLocation({ lat: latitude, lon: longitude });

          // Live distance to destination
          const toRad = (d: number) => (d * Math.PI) / 180;
          const R = 6371000;
          const dLat = toRad(navigatingMosque.lat - latitude);
          const dLon = toRad(navigatingMosque.lon - longitude);
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(navigatingMosque.lat)) * Math.sin(dLon / 2) ** 2;
          setLiveDistance(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

          // Turn-by-Turn voice
          if (routeStepsRef.current.length > 0 && currentStepIndexRef.current < routeStepsRef.current.length) {
            const currentStep = routeStepsRef.current[currentStepIndexRef.current];
            if (currentStep?.endLocation?.latLng) {
              const stepLat = currentStep.endLocation.latLng.latitude;
              const stepLon = currentStep.endLocation.latLng.longitude;
              const dLat2 = toRad(stepLat - latitude);
              const dLon2 = toRad(stepLon - longitude);
              const a2 = Math.sin(dLat2 / 2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(stepLat)) * Math.sin(dLon2 / 2) ** 2;
              const distToManeuver = R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));

              if (distToManeuver < 80 && lastSpokenIndex.current !== currentStepIndexRef.current) {
                const nextStep = routeStepsRef.current[currentStepIndexRef.current + 1];
                if (nextStep?.navigationInstruction?.instructions) {
                  const cleanText = nextStep.navigationInstruction.instructions.replace(/<\/?[^>]+(>|$)/g, '');
                  Speech.speak(cleanText);
                  setCurrentInstruction(cleanText);
                }
                lastSpokenIndex.current = currentStepIndexRef.current;
                currentStepIndexRef.current += 1;
              }
            }
          }

          // Off-route Detection (Re-routing)
          const activePath = routeCoordsRef.current;
          if (activePath.length > 1) {
            let minDistance = Infinity;
            // Simplified Cross-Track Distance for short segments using local flat approximation
            for (let i = 0; i < activePath.length - 1; i++) {
              const p1 = activePath[i];
              const p2 = activePath[i + 1];
              
              const x = (longitude - p1.longitude) * Math.cos((p1.latitude + latitude) * Math.PI / 360) * 111320;
              const y = (latitude - p1.latitude) * 111320;
              
              const dx = (p2.longitude - p1.longitude) * Math.cos((p1.latitude + p2.latitude) * Math.PI / 360) * 111320;
              const dy = (p2.latitude - p1.latitude) * 111320;
              
              const len2 = dx * dx + dy * dy;
              let t = -1;
              if (len2 !== 0) {
                 t = ((x * dx) + (y * dy)) / len2;
              }
              
              let dist;
              if (t < 0) {
                 dist = Math.sqrt(x*x + y*y);
              } else if (t > 1) {
                 const x2 = (longitude - p2.longitude) * Math.cos((p2.latitude + latitude) * Math.PI / 360) * 111320;
                 const y2 = (latitude - p2.latitude) * 111320;
                 dist = Math.sqrt(x2*x2 + y2*y2);
              } else {
                 const projX = t * dx;
                 const projY = t * dy;
                 dist = Math.sqrt((x - projX)**2 + (y - projY)**2);
              }
              if (dist < minDistance) minDistance = dist;
            }
            
            if (minDistance > 40) { // Off route by > 40 meters
              offRouteTicks++;
              if (offRouteTicks >= 3) {
                offRouteTicks = 0;
                Speech.speak("Rerouting");
                fetchRoute(latitude, longitude, true);
              }
            } else {
              offRouteTicks = 0; // Reset debounce if back on path
            }
          }

          // Smoothly track camera — only every other update to avoid animation overlap
          if (mapRef.current) {
            mapRef.current.animateCamera({
              center: { latitude, longitude },
              pitch: 60,
              heading: headingRef.current,
              zoom: 19,
              altitude: 100,
            }, { duration: 1400 });
          }
        }
      );

      // ── Step 4: Watch heading ──
      headSub = await Location.watchHeadingAsync((headingData) => {
        if (!isActive) return;
        const newMag = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        const lastMag = headingRef.current;
        let diff = newMag - (lastMag % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        headingRef.current = lastMag + diff * 0.15;

        Animated.timing(roseAnim, {
          toValue: -headingRef.current,
          useNativeDriver: true,
          duration: 150,
        }).start();
      });
    };

    startNav();

    return () => {
      isActive = false;
      posSub?.remove();
      headSub?.remove();
      setRouteCoordinates([]);
      setCurrentInstruction(null);
      Speech.stop();
    };
  }, [navigatingMosque, travelMode]);


  const searchPlace = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!text.trim()) { setSearchSuggestions([]); return; }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${PLACES_KEY}&types=geocode|establishment`
        );
        const json = await res.json();
        if (json.predictions) {
          setSearchSuggestions(
            json.predictions.slice(0, 5).map((p: any) => ({ placeId: p.place_id, description: p.description }))
          );
        }
      } catch { /* silent fail */ }
      setSearchLoading(false);
    }, 350);
  };

  const selectPlace = async (placeId: string, description: string) => {
    Keyboard.dismiss();
    setSearchModalVisible(false);
    setSearchQuery(description);
    setSearchSuggestions([]);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${PLACES_KEY}`
      );
      const json = await res.json();
      const loc = json.result?.geometry?.location;
      if (loc) {
        setPinnedLocation({ lat: loc.lat, lon: loc.lng });
        fetchMosques(loc.lat, loc.lng);
      }
    } catch { /* silent fail */ }
  };

  const openDirections = (mosque: Mosque, mode: 'DRIVE' | 'WALK' = 'DRIVE') => {
    setTravelMode(mode);
    setNavigatingMosque(mosque);
    setLiveDistance(mosque.distance);
  };

  const openNativeMaps = () => {
    if (!navigatingMosque) return;
    const label = encodeURIComponent(navigatingMosque.name);
    const googleMapsUrl = `google.navigation:q=${navigatingMosque.lat},${navigatingMosque.lon}`;
    const appleMapsUrl = `maps://?daddr=${navigatingMosque.lat},${navigatingMosque.lon}&dirflg=d`;
    const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${navigatingMosque.lat},${navigatingMosque.lon}&travelmode=driving`;

    Linking.canOpenURL(googleMapsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(googleMapsUrl);
      } else {
        Linking.canOpenURL(appleMapsUrl).then((appleSupported) => {
          if (appleSupported) {
            Linking.openURL(appleMapsUrl);
          } else {
            Linking.openURL(webFallback);
          }
        });
      }
    });
  };

  const centerOnUser = () => {
    setPinnedLocation(null); // Clear custom pin
    if (userLocation) {
      fetchMosques(userLocation.lat, userLocation.lon);
    }
    
    if (userLocation && mapRef.current) {
      if (navigatingMosque) {
        // Google Maps style 3D navigation perspective
        mapRef.current.animateCamera({
          center: { latitude: userLocation.lat, longitude: userLocation.lon },
          pitch: 60,
          heading: headingRef.current,
          zoom: 19,
          altitude: 100,
        }, { duration: 1000 });
      } else {
        // Standard 2D top-down perspective
        mapRef.current.animateCamera({
          center: { latitude: userLocation.lat, longitude: userLocation.lon },
          pitch: 0,
          heading: 0,
          zoom: 15,
          altitude: 1000,
        }, { duration: 1000 });
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType={mapType}
        showsUserLocation={!navigatingMosque}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={true}
        pitchEnabled={true}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        onPress={(e) => {
          // Don't drop a pin if we tapped a marker (nativeEvent.action will be 'marker-press')
          if (e.nativeEvent.action === 'marker-press') return;
          if (navigatingMosque) return; // Don't drop pins during navigation
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setPinnedLocation({ lat: latitude, lon: longitude });
          fetchMosques(latitude, longitude);
        }}
        initialCamera={{
          center: {
            latitude: userLocation?.lat ?? 21.4225,
            longitude: userLocation?.lon ?? 39.8262,
          },
          pitch: 0,
          heading: 0,
          zoom: 14,
          altitude: 5000,
        }}
      >
        {/* Custom Navigation Puck — shown only when navigating */}
        {navigatingMosque && userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}  // Rotates with the map
            rotation={headingRef.current}
            tracksViewChanges={true}
          >
            <Animated.View style={[styles.puckOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.puckInner}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  {/* White chevron arrow pointing up */}
                  <Path
                    d="M12 2 L20 20 L12 15 L4 20 Z"
                    fill="#fff"
                  />
                </Svg>
              </View>
            </Animated.View>
          </Marker>
        )}
        {/* Custom pinned location marker */}
        {pinnedLocation && (
          <Marker
            coordinate={{ latitude: pinnedLocation.lat, longitude: pinnedLocation.lon }}
            anchor={{ x: 0.5, y: 1.0 }}
            title="Pinned Location"
            description="Showing mosques around here"
          >
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.pinnedBubble, { backgroundColor: accentColor }]}>
                <MapPin size={16} color={isDark ? '#000' : '#fff'} />
              </View>
              <View style={[styles.pinnedTip, { backgroundColor: accentColor }]} />
            </View>
          </Marker>
        )}
        {mosques.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lon }}
            anchor={{ x: 0.5, y: 1.0 }}
            onPress={() => setSelectedMosque(m)}
          >
            <MosquePin
              color={accentColor}
              size={48}
              active={navigatingMosque?.id === m.id}
            />
          </Marker>
        ))}
        {navigatingMosque && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={travelMode === 'WALK' ? '#22c55e' : accentColor}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      <SafeAreaView pointerEvents="box-none" style={styles.overlayArea}>
        {navigatingMosque ? (
          <BlurView intensity={80} tint={isDark ? 'dark' : 'prominent'} style={[styles.turnCard, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <Navigation size={32} color={isDark ? '#fff' : '#000'} style={{ transform: [{ rotate: '45deg' }] }} />
              <Text style={[styles.turnCardText, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                {currentInstruction || "Proceed to route"}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.turnCardSubtext, { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>
                  {(liveDistance / 1000).toFixed(2)} km
                </Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' }} />
                <Text style={[styles.turnCardSubtext, { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }]}>
                  {navigatingMosque.name}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={openNativeMaps} style={[styles.turnCardBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }]}>
                  <ExternalLink size={20} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setNavigatingMosque(null); setRouteCoordinates([]); setCurrentInstruction(null); Speech.stop(); }} style={[styles.turnCardBtn, { backgroundColor: 'rgba(255,0,0,0.4)' }]}>
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        ) : (
          <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.header, { borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Nearby Mosques</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.refreshBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setSearchModalVisible(true)}
              >
                <Search size={20} color={accentColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.refreshBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => fetchMosques()}
                disabled={loading}
              >
                <RefreshCw size={20} color={accentColor} />
              </TouchableOpacity>
            </View>
          </BlurView>
        )}

        {/* Search Modal */}
        <Modal
          visible={searchModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSearchModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}>
            <View style={{ width: '100%', paddingHorizontal: 16, marginTop: 60, gap: 8 }}>
              {/* Search Bar */}
              <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.searchBar, { borderColor: colors.border }]}>
                <Search size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search any city or place..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={searchPlace}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  autoFocus={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {searchLoading && <ActivityIndicator size="small" color={accentColor} />}
                <TouchableOpacity
                  style={{ padding: 4 }}
                  onPress={() => setSearchModalVisible(false)}
                >
                  <X size={20} color={accentColor} />
                </TouchableOpacity>
              </BlurView>
              {/* Autocomplete Dropdown */}
              {searchSuggestions.length > 0 && (
                <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.suggestionsList, { borderColor: colors.border }]}>
                  {searchSuggestions.map((s, i) => (
                    <TouchableOpacity
                      key={s.placeId}
                      style={[
                        styles.suggestionItem,
                        i < searchSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                      onPress={() => selectPlace(s.placeId, s.description)}
                    >
                      <MapPin size={14} color={accentColor} style={{ marginTop: 1 }} />
                      <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>
                        {s.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </BlurView>
              )}
            </View>
          </View>
        </Modal>

        {loading && (
          <View style={[styles.loadingBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Finding mosques…</Text>
          </View>
        )}

        {!loading && mosques.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MapPin size={13} color={accentColor} />
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {mosques.length} mosque{mosques.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {errorMsg && (
          <View style={[styles.errorCard, { backgroundColor: colors.coral + '20', borderColor: colors.coral }]}>
            <AlertCircle size={20} color={colors.coral} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.errorText, { color: colors.coral }]}>{errorMsg}</Text>
              <TouchableOpacity
                onPress={() => fetchMosques()}
                style={[styles.retryBtn, { backgroundColor: colors.coral }]}
              >
                <Text style={styles.retryBtnText}>Tap to Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Mosque info bottom card — shown when a marker is tapped */}
      {selectedMosque && !navigatingMosque && (
        <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.bottomCard, { borderColor: colors.border }]}>
          <View style={styles.bottomCardDragBar} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.calloutTitle, { color: colors.text }]} numberOfLines={2}>
                {selectedMosque.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {selectedMosque.rating ? (
                  <View style={[styles.ratingBadge, { backgroundColor: accentBgColor }]}>
                    <Text style={{ fontSize: 12, color: accentColor, fontFamily: Fonts.sansSemiBold }}>★ {selectedMosque.rating.toFixed(1)}</Text>
                  </View>
                ) : null}
                <Text style={[{ fontSize: 13, fontFamily: Fonts.sans, color: colors.textSecondary }]}>
                  {(selectedMosque.distance / 1000).toFixed(1)} km away
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeNavBtn, { backgroundColor: colors.border }]}
              onPress={() => setSelectedMosque(null)}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          {selectedMosque.address ? (
            <Text style={[styles.calloutDesc, { color: colors.textSecondary, marginBottom: 12 }]} numberOfLines={2}>
              📍 {selectedMosque.address}
            </Text>
          ) : null}
          <View style={styles.calloutActions}>
            <TouchableOpacity
              style={[styles.calloutActionBtn, { backgroundColor: accentColor }]}
              onPress={() => { openDirections(selectedMosque, 'DRIVE'); setSelectedMosque(null); }}
            >
              <Truck size={15} color={isDark ? '#000' : '#fff'} />
              <Text style={[styles.directionsText, { color: isDark ? '#000' : '#fff' }]}>Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.calloutActionBtn, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: accentColor }]}
              onPress={() => { openDirections(selectedMosque, 'WALK'); setSelectedMosque(null); }}
            >
              <FontAwesome5 name="walking" size={15} color={accentColor} />
              <Text style={[styles.directionsText, { color: accentColor }]}>Walk</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
      <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.mapTypeBtn, { borderColor: colors.border }]}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={cycleMapType}>
        {(() => { const Icon = MAP_TYPE_ICONS[mapType]; return <Icon size={20} color={accentColor} />; })()}
        <Text style={[styles.mapTypeBtnText, { color: colors.text }]}>{MAP_TYPE_LABELS[mapType]}</Text>
        </TouchableOpacity>
      </BlurView>

      {/* Center on user */}
      <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.locationBtn, { borderColor: colors.border }]}>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={centerOnUser}>
        <Navigation size={24} color={accentColor} />
        </TouchableOpacity>
      </BlurView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayArea: {
    ...StyleSheet.absoluteFill,
    padding: 16,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  countText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Fonts.sansSemiBold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.sans,
    paddingVertical: 2,
  },
  suggestionsList: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  turnCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    overflow: 'hidden',
  },
  turnCardText: {
    fontSize: 24,
    fontFamily: Fonts.displayMedium,
    color: '#fff',
    flex: 1,
  },
  turnCardSubtext: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
    color: 'rgba(255,255,255,0.9)',
  },
  turnCardBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Custom navigation puck styles
  puckOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(66, 133, 244, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  // Pinned location marker styles
  pinnedBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
  pinnedTip: {
    width: 8,
    height: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -2,
  },
  calloutBubble: {
    width: 220,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 15,
    fontFamily: Fonts.displayMedium,
    marginBottom: 2,
  },
  calloutRating: {
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginBottom: 12,
    lineHeight: 17,
  },
  directionsBtn: {
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  directionsText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
  },
  locationBtn: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    zIndex: 2,
  },
  mapTypeBtn: {
    position: 'absolute',
    bottom: 188, // sits above the location button
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 2,
  },
  mapTypeBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
  },
  navOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  navTitle: {
    fontSize: 17,
    fontFamily: Fonts.displayMedium,
    marginBottom: 2,
  },
  navDistance: {
    fontSize: 14,
    fontFamily: Fonts.sansSemiBold,
  },
  closeNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  modeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  bottomCardDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  calloutDist: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  calloutActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  calloutActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
  },
});

