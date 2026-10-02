# Lahzah — Native Audio Features Roadmap

These three features require a **custom native build** (i.e., `eas build` or `npx expo run:ios`). They cannot run inside Expo Go because they depend on native iOS APIs that Expo Go sandboxes away.

---

## 1. Background Audio *(partially done)*

### Status

✅ Audio continues playing when the app is backgrounded  
❌ No lock screen controls  
❌ No Now Playing widget  

### What's Already Done

- `UIBackgroundModes: ["audio"]` added to `app.json`  
- `staysActiveInBackground: true` set in `setAudioModeAsync`  
- Audio session category is correctly set to allow silent-mode playback  

### What's Missing

Lock screen / Control Center "Now Playing" widget requires the app to register itself with **`AVNowPlayingInfoCenter`** — this is the native iOS API that populates:

- Song title, artist, artwork
- Scrub bar (current time / duration)
- Play / Pause / Skip buttons on the lock screen and in Control Center

### Implementation Plan (custom build only)

**Recommended: `react-native-track-player`**  
This is the gold-standard library for React Native audio with full native background support.

```bash
npx expo install react-native-track-player
```

Replace `useAudioPlayer.ts` with a `TrackPlayer`-based implementation:

```ts
import TrackPlayer, { Capability } from 'react-native-track-player';

await TrackPlayer.setupPlayer();
await TrackPlayer.updateOptions({
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo,
  ],
  compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
});
```

Each track passed to `TrackPlayer.add()` can include:

```ts
{
  url: 'https://...',
  title: 'Al-Fatiha — Ayah 1',
  artist: 'Mishari Rashid al-ʿAfasy',
  artwork: require('../assets/images/quran_banner_blank.jpg'),
}
```

This automatically registers with `AVNowPlayingInfoCenter` — lock screen controls and Control Center appear instantly.

---

## 2. Lock Screen Controls

### Status

❌ Not implemented (requires custom build + Now Playing integration above)

### What It Will Show

- **Title**: Surah name + Ayah number (e.g., "Al-Baqarah — Ayah 12")
- **Artist**: Reciter name (e.g., "Mishari Rashid al-ʿAfasy")
- **Artwork**: Lahzah app icon or Quran banner image
- **Controls**: ⏮ Previous Ayah, ⏸ Pause/Play, ⏭ Next Ayah
- **Scrub bar**: Current position in the Ayah audio

### Dependency

Depends entirely on **Item 1** (Background Audio with `react-native-track-player`). Once that is in place, lock screen controls come for free — no extra work needed.

---

## 3. Dynamic Island Support (iOS 16.1+)

### Status

❌ Not implemented (requires custom build + native Swift module)

### What It Will Show

**Compact/Minimal state (when another app is active)**

- Quran icon on the leading side
- Waveform / pulsing dot animation on the trailing side

**Expanded state (when user long-presses the Dynamic Island)**

- Surah name + Ayah number
- Reciter name
- Play/Pause button
- Progress bar for current Ayah
- Next Ayah button

### Implementation Plan

Dynamic Island uses **Live Activities** (the `ActivityKit` framework on iOS). It requires a **native Swift module**.

#### Step 1 — Create a Live Activity Widget Extension in Xcode

Add a new **Widget Extension** target. Inside it, define a `ActivityAttributes` struct:

```swift
import ActivityKit

struct QuranPlayerAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var surahName: String
    var ayahNumber: Int
    var reciterName: String
    var isPlaying: Bool
    var progress: Double // 0.0 to 1.0
  }
}
```

#### Step 2 — Bridge to JavaScript via Expo Module

```swift
// QuranLiveActivityModule.swift
import ActivityKit
import ExpoModulesCore

public class QuranLiveActivityModule: Module {
  var currentActivity: Activity<QuranPlayerAttributes>?

  public func definition() -> ModuleDefinition {
    Name("QuranLiveActivity")

    AsyncFunction("startActivity") { (surahName: String, ayahNumber: Int, reciterName: String) in
      let initialState = QuranPlayerAttributes.ContentState(
        surahName: surahName, ayahNumber: ayahNumber,
        reciterName: reciterName, isPlaying: true, progress: 0.0
      )
      let activity = try Activity<QuranPlayerAttributes>.request(
        attributes: QuranPlayerAttributes(),
        contentState: initialState,
        pushType: nil
      )
      self.currentActivity = activity
    }

    AsyncFunction("updateActivity") { (ayahNumber: Int, isPlaying: Bool, progress: Double) in
      let updatedState = QuranPlayerAttributes.ContentState(
        surahName: "", ayahNumber: ayahNumber,
        reciterName: "", isPlaying: isPlaying, progress: progress
      )
      await self.currentActivity?.update(using: updatedState)
    }

    AsyncFunction("endActivity") { in
      await self.currentActivity?.end(dismissalPolicy: .immediate)
    }
  }
}
```

#### Step 3 — Call from JavaScript

```ts
import { NativeModules } from 'react-native';
const { QuranLiveActivity } = NativeModules;

// When playback starts
QuranLiveActivity.startActivity(surahName, ayahNumber, reciterName);

// As audio progresses (call on currentTime update)
QuranLiveActivity.updateActivity(ayahNumber, isPlaying, progress);

// When playback ends
QuranLiveActivity.endActivity();
```

---

## Build Requirements

| Feature | Expo Go | Dev Build | Production Build |
| --- | --- | --- | --- |
| Background audio (silent) | ✅ | ✅ | ✅ |
| Lock screen Now Playing widget | ❌ | ✅ | ✅ |
| Lock screen controls | ❌ | ✅ | ✅ |
| Dynamic Island | ❌ | ✅ | ✅ |

### To Get Started with a Dev Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure project for EAS
eas build:configure

# Build a development client for iOS
# (installs on your device like Expo Go but with your native modules)
eas build --platform ios --profile development
```

Once you have a dev build installed on your device, all three features above can be fully enabled.

### 3. Custom Notification Sound Configuration

To ensure the Adhan actually plays when a notification is delivered while the app is in the background, we need to configure Expo Notifications to use a custom sound:

1. Download a standard `adhan.mp3` file and place it in the project assets.
2. Update `app.json` to configure the `expo-notifications` plugin to bundle the `adhan.mp3` file into the native iOS/Android builds.

> Note: Playing custom sounds in background notifications requires a fresh native build (`npx expo run:ios` or `eas build`).

> **WARNING - Expo Custom Sounds Limitation:**
> While we can schedule a notification with `{ sound: 'adhan.mp3' }`, Expo requires this file to be statically bundled into the native app during the build process. You will need to rebuild the native app using `eas build` or `expo run` for the custom background sound to work on your device.

---

## 4. Synchronous "Halaqah" Rooms (Audio & Screen Share)

### Status

❌ Not implemented (planned for after dev build is ready)

### Description

Real-time Audio calling and screen sharing for reciting verses together, featuring Background Blur and Breakout rooms.

### Implementation Plan (custom build only)

Building a WebRTC audio engine with screen sharing from scratch is a massive undertaking. To achieve enterprise-grade quality, we must use a robust SDK.

**Recommended SDK:** `Stream Video SDK for React Native` (`@stream-io/video-react-native-sdk`). It provides:

- Ultra-low latency Audio/ calling.
- **Screen Sharing:** Crucial for sharing Mushaf/verses on screen while reciting.
- **Background Blur & Audio Filters:** Built-in noise cancellation for clear recitation.
- **Breakout Rooms / Huddles:** Ability to split the circle into smaller recitation groups.

> **WARNING - Expo Go Limitation:**
> Advanced WebRTC features, Background Blur, Noise Cancellation, and Screen Sharing SDKs rely heavily on custom native iOS/Android code. **This feature CANNOT be tested or run inside Expo Go.** We will have to generate a custom Native Development Build (`eas build -p ios --profile development`) to implement and test this phase.

---

## 5. Liquid Glass UI (Final Polish)

### Status

✅ Implemented

### Description

Implement beautiful, fluid glassmorphism UI effects using `react-native-liquid-glass`. This will be the final step in polishing the UI aesthetic to a premium tier once all logical data features and native integrations are complete.

- **Repository:** [https://github.com/callstack/liquid-glass](https://github.com/callstack/liquid-glass)

---

## 6. Advanced Circle Features & Goal Tracking (WhatsApp Style)

### Status

🚧 UI in progress (Native features pending custom build)

### Description

Extensive group management and real-time communication features inside Circles, inspired by WhatsApp and focused on Quran goals.

### Database / UI Features (Phase 1)

- **Admin Settings & Approvals:** Restrict circle editing and require admin approval to join via invite code.
- **Group Goals (Khatma/Juz):** Admins can set shared targets (e.g., "Complete 1 Juz per week") visible in a sticky header.
- **Personal Goals:** Individuals can set private or shared goals within the circle.
- **@Mentions:** Support for tagging `@all` or specific `@username` inside the chat to trigger notifications.
- **Member Roles/Tags:** Custom titles assigned by admins to denote group leaders or teachers.

### Native Features (Phase 2 - Custom Build Only)
>
> **WARNING - Expo Go Limitation:**
> Features like **Voice Chats**, **Video/Audio Calls**, and **Voice/Video Notes** require native device APIs (WebRTC, microphone/camera permissions, file storage). These cannot be fully tested in Expo Go and will require a custom native build (`eas build`).

- **Voice Notes:** Audio recording and playback directly in the chat composer using `expo-av`.
- **Silent Voice Chats:** "Drop-in" audio rooms within the circle that don't ring everyone's phone.
- **Group Video Calls:** Full WebRTC integration (e.g., Stream SDK) for live video sessions and screen sharing the Mushaf.

# Integrate Zipformer On-Device Tajweed STT

This plan outlines the architecture and steps to migrate Lahzah from the server-side Hugging Face API to the on-device `Muno459/zipformer_p-quran` model using `sherpa-onnx`.

## User Review Required

> [!WARNING]
> **Native Module Rebuild Required**
> Because `sherpa-onnx` uses C++ and native iOS/Android bindings, you will need to re-run your Expo prebuild (`npx expo run:ios`) or update your CocoaPods. This cannot run in Expo Go.

> [!IMPORTANT]
> **App Size Increase**
> We will bundle the INT8 quantized ONNX model inside the app. This will increase the total app download size by approximately **~75 MB** (the size of the INT8 model and token files). This is highly worthwhile for offline usage and zero-latency analysis.

## Proposed Changes

We will execute this in 4 distinct phases.

### 1. Install Dependencies & Configure Native Project

- Install `react-native-sherpa-onnx` (the official community React Native wrapper for Sherpa-ONNX).
- Ensure the Expo config (`app.json`) is set up to bundle `.onnx` and `.json` model files properly.

### 2. Download Model Assets

We will write a one-time script to pull the necessary files from Hugging Face and place them in the `assets/models/` directory:

- `quran_phoneme_zipformer.int8.onnx` (The neural network)
- `phoneme_units.json` (The tokenizer that decodes network outputs into phoneme strings)
- `quran_text2phoneme.json` (The canonical Ḥafṣ text-to-phoneme dictionary)

### 3. Build the Retrieval Decoder

Because this model outputs raw phonemes (what the user *actually* said), we need to write the "Retrieval Decoder" mentioned in the model card.

- **[NEW]** `src/services/phonemeDecoder.ts`:
  - A utility that compares the recognized phoneme array against the target canonical phonemes from `quran_text2phoneme.json`.
  - Implements the Levenshtein edit distance to calculate the Phoneme Error Rate (PER).
  - Pinpoints exactly where the user deviated (e.g., dropped madd, wrong letter).

### 4. Replace the Hugging Face Pipeline

- **[MODIFY]** `src/services/quranAiApi.ts`:
  - Replace `transcribeAudio()` with a local Sherpa-ONNX initialization.
  - The local pipeline will: Load Model -> Stream Audio from disk to ONNX -> Get Phonemes -> Run Retrieval Decoder -> Output Hifz mistakes.

## Verification Plan

### Automated Tests

- N/A.

### Manual Verification

1. Install the pod dependencies on your local machine and build the iOS app (`npx expo run:ios`).
2. Disconnect from the internet (Airplane Mode).
3. Record an audio clip in the Mutashabihat or Group Hifz tabs and intentionally drop a "madd" or mispronounce a harakat.
4. Verify that the app detects the mistake instantly (<1 second latency).
