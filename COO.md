# Resemble -- Strategy & Feature Guide

> AI-powered face comparison app that scores facial resemblance between people. Two modes: Family Resemblance (child vs parents) and Celebrity Match (you vs any celebrity). Runs on iOS, Android, and Web from a single React Native/Expo codebase.

**Org:** digitalthreadai | **GitHub:** https://github.com/digitalthreadai/Resemble | **Bundle ID:** `ai.digitalthread.resemble`

---

## Vision

Resemble uses AI to compare facial features between people, scoring resemblance with a hybrid engine that blends neural embeddings (70%) with landmark geometry (30%). The result is a deterministic, explainable similarity score broken down by facial region.

Every computation happens on-device. Face data never leaves the phone. There is no server, no cloud processing, no telemetry on biometric data. Users get full transparency into how their score was calculated, with per-feature breakdowns for eyes, nose, mouth, jawline, and eyebrows.

### Differentiators

- **Per-feature breakdown** -- scores for eyes, nose, mouth, jawline, and eyebrows individually, not just one opaque number.
- **Family triangulation** -- compares a child against BOTH parents simultaneously, showing which parent contributed which features.
- **Hybrid scoring engine** -- combines MobileFaceNet/FaceNet neural embeddings with Procrustes-normalized landmark geometry for accuracy across both identity and kinship ranges.
- **Deterministic results** -- same photos always produce the same score. No randomness, no server-side variability.
- **Privacy-first** -- 100% on-device processing. No face data uploaded, no accounts required, no tracking.

---

## Feature Map

### Core Features

| # | Feature | Screen | Description |
|---|---------|--------|-------------|
| 1 | **Family Resemblance** | `app/family.tsx` | Upload child + 1-2 parents. Get per-feature breakdown with animated gauge charts and horizontal feature bars. Shows which parent the child resembles more for each facial region. |
| 2 | **Celebrity Match** | `app/celebrity.tsx` | Upload your photo + a celebrity photo. Compare similarity using the hybrid landmark + neural scoring pipeline. Includes LLM-powered celebrity image search. |
| 3 | **FaceID Camera Scanner** | `app/camera.tsx` | Real-time face detection with a FaceID-style oval guide overlay. Provides live quality feedback (face size, angle, confidence) before capture. |
| 4 | **Comparison History** | `app/history.tsx` | Past results saved locally with thumbnails. Swipe-to-delete. Persisted via AsyncStorage. |
| 5 | **Share Results** | `src/services/share.ts` | Captures a branded result card as PNG using ViewShot, then shares via the system share sheet or downloads directly. |
| 6 | **Celebrity Search** | `src/services/celebritySearch.ts` | LLM-powered (Groq / llama-3.3-70b) celebrity image finder with in-memory caching. Takes a celebrity name, returns curated image URLs for comparison. |

### Infrastructure Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Hybrid Face Engine** | 70% cosine similarity from neural embeddings (MobileFaceNet 192D on native, FaceNet 128D on web) + 30% Procrustes-normalized landmark geometry. Falls back to pure landmarks when embeddings are unavailable. |
| 2 | **Cross-Platform Detection** | ML Kit on native (133 contour points) + face-api.js on web (68 dlib landmarks + 128D FaceNet embeddings). Unified `FaceDetectionService` interface abstracts both. |
| 3 | **ML Kit to dlib68 Mapper** | Converts 133 ML Kit contour points to the standard 68-point dlib format (`src/services/faceDetection/mlKitToDlib68.ts`), enabling the same scoring engine across platforms. |
| 4 | **Photo Quality Assessment** | 4-factor scoring: detection confidence, face size relative to frame, head roll, and head yaw. Surfaces user-facing tips when photo quality is low. |
| 5 | **4-Step Onboarding** | Welcome, How It Works, Privacy, and Tips screens. Completion flag stored in AsyncStorage so it only shows once. |

---

## Face Analysis Engine -- Technical Architecture

### Scoring Pipeline

```
Photo Upload
    |
    v
Face Detection (platform-specific)
    |
    +---> 68 Landmarks (dlib format)
    +---> Embedding Vector (128D web / 192D native)
    |
    v
Landmark Normalization (Procrustes: translate to mid-eye origin, scale by IOD)
    |
    v
Per-Feature Scoring (exponential decay on avg point distance per region)
    |
    v
Hybrid Score = 0.70 * embeddingToScore(cosineSimilarity) + 0.30 * landmarkScore
```

### Feature Weights

| Feature | Weight | Landmark Points | Indices |
|---------|--------|----------------|---------|
| Eyes | 25% | 12 points -- eye shape and lid curvature | 36-47 |
| Nose | 25% | 9 points -- bridge, tip, and nostril width | 27-35 |
| Lips & Mouth | 20% | 20 points -- lip shape, cupid's bow, and width | 48-67 |
| Face Shape (Jawline) | 15% | 17 points -- jawline width and chin shape | 0-16 |
| Eyebrows | 15% | 10 points -- arch height and shape | 17-26 |

Total: 68 landmark points across 5 regions.

### Platform Detection Stack

| Platform | Detection Library | Landmark Output | Embedding Output | Model Size |
|----------|------------------|----------------|-----------------|------------|
| Native (iOS/Android) | Google ML Kit Face Detection | 133 contour points (mapped to 68 dlib) | MobileFaceNet TFLite -- 192D | ~5.2 MB |
| Web | face-api.js v0.22.2 (CDN) | 68 dlib landmarks (native format) | FaceNet -- 128D | ~50 MB (CDN-cached) |

### Unified Detection Interface

Both platforms implement the same `FaceDetectionService` interface:

```typescript
interface FaceDetectionService {
  initialize(): Promise<void>;
  detectFromImage(uri: string): Promise<FaceDetectionResult>;
  isReady(): boolean;
  dispose(): void;
}

interface FaceDetectionResult {
  landmarks: Point2D[];           // 68-point dlib format
  descriptor: Float32Array | null; // 128D (web) or 192D (native)
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  platform: 'web' | 'native';
}
```

Platform resolution is handled at the file level: `index.web.ts` for web, `index.native.ts` for iOS/Android. Metro and webpack resolve the correct file automatically.

### Kinship Calibration

Standard face recognition systems are tuned for identity verification (cosine similarity > 0.8 = same person). Family resemblance operates in a different range:

| Scenario | Typical Cosine Similarity | Mapped Score |
|----------|--------------------------|-------------|
| Unrelated strangers | 0.1 - 0.2 | 0% |
| Distant family resemblance | 0.3 - 0.4 | 10-50% |
| Strong parent-child resemblance | 0.4 - 0.6 | 50-80% |
| Twins / near-identical | 0.6 - 0.8 | 80-95% |
| Same person (identity match) | 0.8+ | 95-100% |

The `embeddingToScore()` function uses a sigmoid mapping calibrated for this kinship range:

```typescript
// Sigmoid-like mapping tuned for family resemblance range
const normalized = (cosSim - 0.2) / 0.6;  // map 0.2-0.8 to 0-1
const curved = 1 / (1 + Math.exp(-6 * (normalized - 0.4)));
return Math.max(0, Math.min(100, Math.round(curved * 100)));
```

### Landmark Normalization

Before scoring, all landmark sets are Procrustes-normalized:

1. Compute the centroid of each eye (points 36-41 and 42-47).
2. Translate all points so the midpoint between the two eye centroids is the origin.
3. Scale all points by the inter-ocular distance (IOD).

This makes comparisons invariant to face position, scale, and minor rotation in the image.

### Per-Feature Similarity

Each feature region's similarity is computed using exponential decay on the average point-to-point distance between normalized landmarks:

```
score = 100 * exp(-avgDistance / 0.12)
```

This produces a 0-100 score where smaller geometric differences yield higher scores, with rapid falloff for large deviations.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | 55.0.5 |
| Runtime | React Native | 0.83.2 |
| Language | TypeScript | 5.9.2 |
| Routing | Expo Router (file-based) | 55.0.4 |
| State Management | React Context + useReducer | 14 action types |
| Face Detection (Web) | face-api.js | 0.22.2 |
| Face Detection (Native) | react-native-vision-camera-face-detector | 1.10.2 |
| Embeddings (Native) | react-native-fast-tflite (MobileFaceNet) | 2.0.0 |
| Camera | expo-camera + react-native-vision-camera | 55.0.9 / 4.7.3 |
| Animation | react-native-reanimated | 4.2.1 |
| Charts / SVG | react-native-svg | 15.15.3 |
| Fonts | @expo-google-fonts (Inter, Space Grotesk, JetBrains Mono) | -- |
| Local Storage | @react-native-async-storage/async-storage | 2.2.0 |
| AI / LLM | Groq API (llama-3.3-70b) via OpenAI SDK | 6.32.0 |
| Image Capture | react-native-view-shot | 4.0.3 |
| Effects | react-native-confetti-cannon | 1.5.2 |
| Image Processing | expo-image-manipulator | 55.0.12 |
| Sharing | expo-sharing | 55.0.12 |
| Build | EAS Build (development, preview, production profiles) | -- |

---

## Color System

Dark glassmorphism theme throughout the app. Role-based colors for clarity in comparison views:

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Parent 1 | Blue | `#2563eb` | First parent's scores and labels |
| Parent 2 | Pink | `#db2777` | Second parent's scores and labels |
| Child | Green | `#059669` | Child indicator and accents |
| Celebrity | Amber | `#f59e0b` | Celebrity mode accents |
| You / Primary | Purple | `#7c3aed` | User's photo and primary actions |
| Background (dark) | -- | `#0a0a1a` | App background, splash screen |

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Foundation | DONE | React Context state management, screen routing, Expo Router setup |
| Web Detection | DONE | face-api.js CDN integration with 68-point landmarks + 128D FaceNet embeddings |
| Engine to UI | DONE | `useAnalysis` hook, eager face detection on upload, full scoring pipeline |
| Hybrid Scoring | DONE | Cosine similarity + `embeddingToScore` + 70/30 hybrid formula for both modes |
| Native Detection | DONE (code) | ML Kit + MobileFaceNet TFLite pipeline written, needs physical device testing |
| History & Share | DONE | AsyncStorage persistence, ViewShot capture, system share sheet integration |
| Celebrity Search | DONE | Groq LLM-powered image finder with in-memory caching |
| Onboarding | DONE | 4-step walkthrough (Welcome, How It Works, Privacy, Tips) with AsyncStorage flag |
| Premium UI | DONE | Dark glassmorphism theme, staggered animations, confetti on high scores, shimmer loading |
| EAS Build Config | READY | `eas.json` configured with development/preview/production profiles. Needs Apple Developer account for iOS builds. |
| Camera Frame Processor | TODO | Wire real-time ML Kit frame processor for live camera scanning (currently simulated on native) |
| Celebrity Embedding DB | TODO | Pre-compute 500 celebrity face embeddings for offline matching without LLM image search |
| Fine-tune for Kinship | TODO | Train or fine-tune MobileFaceNet on the FIW (Families in the Wild) dataset for +5-15% kinship accuracy |
| Service Worker | TODO (low) | Add a service worker to pre-cache face-api.js models for guaranteed offline web use |

---

## File Structure

```
resemble/
|-- app/                               # Expo Router screens
|   |-- _layout.tsx                    # Root layout (providers, theme, onboarding gate)
|   |-- index.tsx                      # Landing page (hero, features, privacy messaging)
|   |-- family.tsx                     # Family comparison (3 upload slots + results)
|   |-- celebrity.tsx                  # Celebrity match (2 upload slots + results)
|   |-- camera.tsx                     # FaceID-style camera scanner
|   +-- history.tsx                    # Comparison history list
|
|-- src/
|   |-- engine/                        # Face analysis engine (pure TypeScript, no platform deps)
|   |   |-- constants.ts               # FEATURES (5 regions) + FEATURE_WEIGHTS
|   |   |-- landmarks.ts              # Scoring: cosine sim, landmark sim, hybrid pipeline
|   |   |-- accuracy.ts               # Photo quality assessment (confidence, size, roll, yaw)
|   |   +-- index.ts                   # Barrel export
|   |
|   |-- services/
|   |   |-- faceDetection/
|   |   |   |-- types.ts              # FaceDetectionService + FaceDetectionResult interfaces
|   |   |   |-- index.web.ts          # Web: face-api.js CDN pipeline
|   |   |   |-- index.native.ts       # Native: ML Kit + MobileFaceNet TFLite
|   |   |   |-- mlKitToDlib68.ts      # 133 ML Kit contour -> 68 dlib mapper
|   |   |   +-- index.ts              # Platform barrel (Metro/webpack resolves .web/.native)
|   |   |
|   |   |-- history.ts                # AsyncStorage CRUD + thumbnail persistence
|   |   |-- share.ts                   # ViewShot capture + system sharing
|   |   +-- celebritySearch.ts         # Groq LLM celebrity image finder with cache
|   |
|   |-- components/                    # 14 reusable components
|   |   |-- Button.tsx                 # Gradient primary, secondary, ghost variants + shimmer
|   |   |-- UploadCard.tsx             # Photo upload with preview + detection status badge
|   |   |-- GaugeChart.tsx             # Animated SVG circular gauge (react-native-svg)
|   |   |-- FeatureBar.tsx             # Animated horizontal bars + FeatureBreakdown compound
|   |   |-- FaceOvalGuide.tsx          # Camera SVG oval overlay (FaceID-style)
|   |   |-- ComparisonHeader.tsx       # Screen header with back navigation
|   |   |-- ErrorBox.tsx               # Shake-animated error display
|   |   |-- ConfettiOverlay.tsx        # Celebration effect (triggers when score > 60%)
|   |   |-- ScoreReveal.tsx            # Staggered results animation sequence
|   |   |-- OnboardingSteps.tsx        # 4-step welcome walkthrough
|   |   |-- HistoryCard.tsx            # History list item with thumbnail previews
|   |   |-- ShimmerPlaceholder.tsx     # Loading shimmer effect
|   |   |-- CelebrityBrowser.tsx       # Celebrity search input + image grid
|   |   +-- ResultsShareView.tsx       # Off-screen branded share card for capture
|   |
|   |-- hooks/                         # 5 custom hooks
|   |   |-- useAnalysis.ts             # Orchestrates detection + scoring pipeline
|   |   |-- useImagePicker.ts          # Image selection + context dispatch
|   |   |-- useHistory.ts              # History CRUD operations
|   |   |-- useOnboarding.ts           # Onboarding completion flag
|   |   +-- useCelebrities.ts          # Celebrity search + cache management
|   |
|   |-- context/
|   |   +-- ResembleContext.tsx         # Global state (useReducer, 14 action types)
|   |
|   |-- theme/                         # Design system
|   |   |-- colors.ts                  # Dark glassmorphism palette
|   |   |-- spacing.ts                 # Responsive breakpoints + sizes
|   |   |-- animations.ts              # Shared animation configs (reanimated)
|   |   |-- webStyles.ts               # Web-only glassmorphism + hover effects
|   |   |-- fonts.ts                   # Google Fonts loading (Inter, Space Grotesk, JetBrains)
|   |   +-- index.ts                   # Barrel export
|   |
|   +-- types/
|       +-- index.ts                   # Shared type definitions
|
|-- assets/
|   |-- models/
|   |   +-- mobilefacenet.tflite       # MobileFaceNet model (5.2 MB, 192D output)
|   |-- icon.png                       # App icon
|   |-- splash-icon.png                # Splash screen
|   |-- favicon.png                    # Web favicon
|   |-- android-icon-foreground.png    # Android adaptive icon
|   |-- android-icon-background.png    # Android adaptive icon
|   +-- android-icon-monochrome.png    # Android adaptive icon
|
|-- app.json                           # Expo config (plugins, permissions, bundle IDs)
|-- eas.json                           # EAS Build profiles (dev, preview, production)
|-- package.json                       # Dependencies + scripts
|-- tsconfig.json                      # TypeScript config (strict mode)
|-- index.ts                           # Entry point
|-- CLAUDE.md                          # AI assistant instructions
|-- COO.md                             # This file -- strategy and feature guide
+-- TODOS.md                           # Deferred improvements and tech debt
```

---

## Running the App

```bash
# Web (quick testing)
npm run web

# iOS (requires macOS + Xcode)
npm run ios

# Android (requires Android Studio + emulator)
npm run android

# Expo dev server (choose platform interactively)
npx expo start
```

The web dev server runs on port 4003 and registers with portless at `https://resemble.localhost:1355`.

### EAS Build

```bash
# Development build (internal distribution)
eas build --profile development --platform ios
eas build --profile development --platform android

# Production build (store submission)
eas build --profile production --platform ios
eas build --profile production --platform android
```

The `eas.json` file defines three profiles: `development` (dev client, internal), `preview` (internal distribution), and `production` (auto-increment, store-ready).

---

## Privacy Architecture

Resemble is designed so that face data never leaves the device:

1. **No server calls for face processing.** All detection, landmark extraction, embedding generation, and scoring happen locally.
2. **No accounts.** The app works immediately with no sign-up, no login, no user tracking.
3. **No biometric storage.** Landmarks and embeddings are computed in memory, used for scoring, and discarded. Only the numeric scores and thumbnail images persist in history.
4. **History is local-only.** Comparison results are stored in AsyncStorage on the device. Nothing is synced to any cloud service.
5. **Camera permissions are explicit.** iOS and Android permission prompts clearly state the purpose (face scanning for comparison).

The only network call the app makes is to the Groq API for celebrity image search, and that request contains only the celebrity name -- never any face data or user photos.

---

## State Management

Global state is managed via React Context with `useReducer`, supporting 14 action types:

| Category | Actions |
|----------|---------|
| Photo slots | Set/clear photos for child, parent1, parent2, user, celebrity |
| Detection | Store landmarks + descriptors per slot |
| Analysis | Set comparison results, loading state, errors |
| UI | Toggle modes, reset state, set quality assessments |

The context provider wraps the entire app in `app/_layout.tsx`, making state accessible to all screens and components.

---

## Original Web App

The original static PWA is preserved at `C:\Apps\claude\familyface\` for reference and quick browser testing. It uses vanilla HTML/JS with face-api.js loaded from CDN. The React Native app is a complete rewrite with the same scoring engine ported to TypeScript.
