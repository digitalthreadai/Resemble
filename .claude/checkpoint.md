# Resemble — Session Checkpoint

## Date: 2026-03-28

## What Was Done This Session

### Face Engine Architecture Upgrade
Deep research completed on face detection/matching tech. Upgraded from landmarks-only scoring to a hybrid engine:

**New Architecture:**
- **Native detection**: Google ML Kit via `react-native-vision-camera-face-detector` (133 contour pts, 30fps)
- **Native embeddings**: MobileFaceNet 192D via `react-native-fast-tflite` (5MB TFLite model, 18ms, GPU accelerated)
- **Web**: face-api.js (unchanged — 68-pt landmarks + 128D FaceNet)
- **Scoring**: 70% cosine similarity (embeddings) + 30% landmark structural similarity
- **Celebrity DB plan**: Hybrid — ship 500 pre-computed embeddings locally + cloud API fallback

**Files Changed:**
- `src/engine/landmarks.ts` — Added `cosineSimilarity()`, `embeddingToScore()`, updated `computeScores()` and `computeCelebScores()` to use hybrid 70/30 scoring
- `src/engine/index.ts` — Exported new functions
- `src/services/faceDetection/index.native.ts` — Replaced stub with full ML Kit + MobileFaceNet pipeline
- `src/services/faceDetection/types.ts` — Documented 128D (web) vs 192D (native) descriptor sizes
- `src/hooks/useAnalysis.ts` — Family mode now passes descriptors to `computeScores()`
- `app.json` — Added `react-native-fast-tflite` plugin with CoreML + Android GPU delegates
- `assets/models/mobilefacenet.tflite` — 5.2MB MobileFaceNet model (112x112 input → 192D output)

**Packages Added:**
- `react-native-vision-camera-face-detector` — ML Kit face detection for Vision Camera
- `react-native-fast-tflite` — TFLite runtime with GPU acceleration (JSI)
- `expo-image-manipulator` — Face cropping/resizing for embedding extraction
- `react-native-worklets` — Required by Reanimated 4.x

**EAS Build:**
- `eas.json` created with development, preview, and production profiles
- User needs to run `eas build --platform ios --profile preview` to build iOS

### Previous Session Work (Still In Place)
- Phase 1-6 implemented (context, web detection, scoring, history, share, celebrity, onboarding)
- Premium UI theme system (colors, spacing, animations, web glassmorphism)
- All screen layouts (landing, family, celebrity, camera, history)

## Architecture Decisions
- **Hybrid scoring**: 70% embedding cosine similarity + 30% landmark structural — captures both "looks like" (appearance) and "same shape" (geometry)
- **MobileFaceNet over ArcFace**: 5MB vs 20MB, 18ms vs 30ms, good enough for family resemblance
- **TFLite over ONNX**: Tighter VisionCamera integration, GPU via CoreML/NNAPI, same author (mrousavy)
- **192D embeddings**: Standard InsightFace MobileFaceNet outputs 192D (not 128D as some papers suggest)
- **Cosine similarity**: Research consensus for face embeddings — replaces naive Euclidean distance
- **Kinship calibration**: `embeddingToScore()` maps 0.2-0.8 cosine range to 0-100 using sigmoid (family resemblance typically 0.3-0.6, not >0.8 like identity matching)

## Known Issues / TODOs
1. Native ML Kit `detectFaces()` static image API needs testing on actual device
2. MobileFaceNet TFLite inference needs testing (model loads but embedding pipeline untested)
3. Camera frame processor still uses simulated timer (not real ML Kit data)
4. Celebrity search needs GROQ_API_KEY configured
5. Web face-api.js should upgrade to `@vladmandic/face-api` (maintained fork)
6. Share button not yet added to results section
7. History auto-save not wired
8. EAS Build not yet run (user needs Apple Developer account)

## Build Status
- Web export: PASSING (`npx expo export --platform web` — 2.7MB bundle)
- TypeScript: PASSING (`npx tsc --noEmit` — zero errors)
- Native: NOT TESTED (needs EAS Build or expo prebuild)

## Next Steps
1. Test native build via EAS Build (iOS) or local Android
2. Test ML Kit + MobileFaceNet pipeline with real photos on device
3. Upgrade web to `@vladmandic/face-api` maintained fork
4. Wire camera frame processor with real ML Kit detection
5. Add Share button to results
6. Auto-save to history after analysis
7. Build celebrity embedding database (top 500)
