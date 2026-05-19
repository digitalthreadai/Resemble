# Resemble

> AI-powered face comparison — discover family resemblance and find your celebrity match.

**Resemble** compares facial features between people using a hybrid AI engine that combines neural face embeddings (70%) with geometric landmark analysis (30%). Two modes: **Family Resemblance** shows which parent a child looks more like with per-feature breakdowns, and **Celebrity Match** scores your similarity to any celebrity. 100% on-device processing — your face data never leaves your phone.

## Features

- **Family Resemblance** — Upload child + 1-2 parents, see per-feature breakdown (eyes, nose, mouth, jawline, eyebrows)
- **Celebrity Match** — Compare your face against any celebrity with neural + landmark scoring
- **FaceID Camera** — Real-time face scanning with quality feedback and oval guide
- **Hybrid AI Engine** — 70% MobileFaceNet embeddings + 30% landmark geometry for accurate results
- **Privacy First** — All face detection runs on-device. Zero data uploaded. Ever.
- **Cross-Platform** — iOS, Android, and Web from a single TypeScript codebase
- **Comparison History** — Save and revisit past comparisons
- **Share Results** — Export branded result cards as PNG

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 55 + React Native 0.83.2 |
| Language | TypeScript (strict) |
| Routing | Expo Router |
| Face Detection (Web) | face-api.js v0.22.2 |
| Face Detection (Native) | Google ML Kit |
| Face Embeddings | MobileFaceNet TFLite (192D, 5.2MB, 18ms) |
| Camera | expo-camera + react-native-vision-camera |
| Animation | react-native-reanimated |
| Storage | AsyncStorage |
| AI/Celebrity Search | Groq API (llama-3.3-70b) |
| Build | EAS Build |

## Quick Start

```bash
git clone https://github.com/digitalthreadai/Resemble.git
cd Resemble
npm install
npm run web        # Web dev server
```

### Other platforms

```bash
npm run ios        # iOS (requires macOS + Xcode)
npm run android    # Android (requires Android Studio)
npx expo start    # Universal (Expo Go)
```

### Environment (optional)

```bash
# Only needed for celebrity search mode
echo "EXPO_PUBLIC_GROQ_API_KEY=your_key" > .env.local
```

## How It Works

### Hybrid Scoring Engine

```
Photo --> Face Detection --> Landmark Normalization --> Hybrid Score
                                                          |
                                            70% embedding cosine similarity
                                          + 30% landmark structural similarity
```

Resemble analyzes 5 facial regions with weighted importance:

| Region | Weight | What It Measures |
|--------|--------|-----------------|
| Eyes | 25% | Eye shape, lid curvature |
| Nose | 25% | Bridge, tip, nostril width |
| Mouth | 20% | Lip shape, cupid's bow |
| Jawline | 15% | Face shape, chin |
| Eyebrows | 15% | Arch height, shape |

### Platform Detection

| Platform | Detection | Landmarks | Embeddings |
|----------|-----------|-----------|------------|
| iOS/Android | Google ML Kit (133 pts) | 68 dlib (mapped) | MobileFaceNet 192D |
| Web | face-api.js | 68 dlib | FaceNet 128D |

## Setup Guide

See **[SITECONFIGURATIONS.md](./SITECONFIGURATIONS.md)** for complete setup instructions.

## Strategy & Features

See **[COO.md](./COO.md)** for the full strategy document.

## Project Structure

```
resemble/
├── app/                    # Screens (Expo Router)
│   ├── index.tsx           # Landing page
│   ├── family.tsx          # Family comparison
│   ├── celebrity.tsx       # Celebrity match
│   ├── camera.tsx          # Face scanner
│   └── history.tsx         # Past comparisons
├── src/
│   ├── engine/             # Face analysis (pure TypeScript)
│   ├── services/           # Detection, history, share, celebrity
│   ├── components/         # 14 reusable components
│   ├── hooks/              # 5 custom hooks
│   ├── context/            # Global state (useReducer)
│   └── theme/              # Dark design system
├── assets/models/          # MobileFaceNet TFLite (5.2MB)
├── app.json                # Expo config
└── eas.json                # Build profiles
```

## Scripts

```bash
npm run web          # Web dev server (port 4003)
npm run ios          # iOS simulator
npm run android      # Android emulator
npx expo start      # Universal dev server
npx tsc --noEmit    # Type check
npx expo export --platform web  # Production web build
eas build --platform ios --profile preview  # Cloud iOS build
```

## License

Private -- digitalthreadai
