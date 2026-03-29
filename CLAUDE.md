# CLAUDE.md

## Project

**Resemble** — React Native (Expo) app that compares facial landmarks between people using AI. Two modes: Family Resemblance (child vs parents) and Celebrity Match (you vs any celebrity). Runs on iOS, Android, and Web from a single codebase.

## Running

```bash
cd resemble
npm run web        # web dev server (quick testing)
npm run ios        # iOS simulator (needs macOS)
npm run android    # Android emulator
npx expo start    # Expo dev server (choose platform)
```

## Architecture

**Expo SDK 55** with **Expo Router** (file-based routing) + TypeScript.

### Directory Structure

```
app/                    ← Expo Router screens
  _layout.tsx           ← Root layout (dark theme, Stack navigator)
  index.tsx             ← Landing page (hero + feature cards)
  family.tsx            ← Family comparison (3 upload slots + results)
  celebrity.tsx         ← Celebrity match (2 upload slots + results)
  camera.tsx            ← FaceID-style camera scanner with oval guide
src/
  engine/               ← Face analysis engine (pure TypeScript, no platform deps)
    constants.ts        ← FEATURES (5 regions), FEATURE_WEIGHTS
    landmarks.ts        ← normaliseLandmarks, featureSim, computeScores, computeCelebScores
    accuracy.ts         ← computeAccuracy, assessCameraQuality
    index.ts            ← barrel export
  components/
    Button.tsx          ← primary/secondary/ghost variants
    UploadCard.tsx      ← Photo upload with preview, camera button, quality badge
    GaugeChart.tsx      ← Animated SVG circular gauge (react-native-svg)
    FeatureBar.tsx      ← Animated horizontal bars + FeatureBreakdown compound
    FaceOvalGuide.tsx   ← SVG oval overlay for camera (FaceID-style)
  hooks/
    useImagePicker.ts   ← Generic image picker hook with slot management
  theme/
    colors.ts           ← Dark glassmorphism color system
    spacing.ts          ← Spacing, radius, breakpoints
```

### Face Detection Status

The **analysis engine** (scoring, normalisation, accuracy) is fully ported and functional.

**TODO — wire face detection per platform:**
- **Native (iOS/Android):** Use `react-native-vision-camera` frame processors + Google ML Kit Face Detection for real-time 30fps scanning. The Vision Camera package is already installed.
- **Web:** Use `face-api.js` (same CDN-loaded models as the original PWA). Load SSD, landmarks, and recognition models on page load.

### Key Constants

| Constant | File | Purpose |
|---|---|---|
| `FEATURES` | `src/engine/constants.ts` | 5 facial regions with 68-pt landmark index ranges |
| `FEATURE_WEIGHTS` | `src/engine/constants.ts` | eyes 25%, nose 25%, mouth 20%, jawline 15%, eyebrows 15% |

### Color System

Parent 1 = blue (`#2563eb`), Parent 2 = pink (`#db2777`), Child = green (`#059669`), Celebrity = amber (`#f59e0b`), You/Primary = purple (`#7c3aed`).

### Original Web App

The original static PWA is preserved at `C:\Apps\claude\familyface\` for reference and quick browser testing.
