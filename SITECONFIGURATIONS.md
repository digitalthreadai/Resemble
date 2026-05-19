# Site Configuration Guide — Resemble

Step-by-step setup for the Resemble face comparison app (React Native / Expo). This guide covers local development, cloud builds, and deployment for all three platforms: iOS, Android, and Web.

---

## 1. Prerequisites

Install the following before you begin.

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 18+ | JavaScript runtime |
| npm | 9+ (ships with Node) | Package manager |
| [Git](https://git-scm.com/) | Any recent | Version control |
| Expo CLI | Latest (`npx expo`) | Dev server and bundler |
| [EAS CLI](https://docs.expo.dev/eas/) | 15+ (`npm install -g eas-cli`) | Cloud builds for iOS/Android |

**Platform-specific (optional):**

| Tool | When You Need It |
|------|------------------|
| Apple Developer account ($99/year) | iOS device builds and App Store submission |
| [Android Studio](https://developer.android.com/studio) | Local Android emulator testing |
| [Xcode](https://developer.apple.com/xcode/) (macOS only) | Local iOS simulator testing |

You do **not** need a Mac to build for iOS. EAS builds run in the cloud.

---

## 2. Clone and Install

```bash
git clone https://github.com/digitalthreadai/Resemble.git
cd Resemble
npm install
```

Verify the install succeeded:

```bash
npx expo --version
```

You should see the Expo CLI version printed. If `npm install` fails, delete `node_modules` and `package-lock.json`, then run `npm install` again.

---

## 3. Environment Variables

| Variable | Description | Where to Get It | Required |
|----------|-------------|-----------------|----------|
| `EXPO_PUBLIC_GROQ_API_KEY` | Groq API key for celebrity search (llama-3.3-70b via OpenAI SDK) | [console.groq.com/keys](https://console.groq.com/keys) | Only for celebrity mode |

### Setup

Create a `.env.local` file in the project root. This file is gitignored and will not be committed.

```bash
echo "EXPO_PUBLIC_GROQ_API_KEY=your_key_here" > .env.local
```

Replace `your_key_here` with your actual Groq API key.

**Important:** Do not store API keys in `app.json`, in source files, or in any file that is tracked by Git. The project uses gitleaks pre-commit hooks that will block commits containing secrets.

If you only need Family Resemblance mode (child vs parents), you can skip this step entirely. Celebrity mode is the only feature that requires the Groq key.

---

## 4. Run the Development Server

### Web (quickest way to test)

```bash
npm run web
```

This starts the Expo dev server on port 4003. Open [http://localhost:4003](http://localhost:4003) in your browser.

With portless configured (see Section 8), the app is available at [https://resemble.localhost:1355](https://resemble.localhost:1355).

If portless is not installed, use the direct variant instead:

```bash
npm run web:direct
```

### Android

```bash
npm run android
```

This requires either Android Studio with an emulator running, or a physical Android device connected via USB with developer mode enabled. The command calls `expo run:android`, which builds and installs the app on the connected device.

### iOS (requires macOS with Xcode)

```bash
npm run ios
```

This opens the iOS Simulator via Xcode. Not available on Windows or Linux. Use EAS cloud builds (Section 5) to build for iOS without a Mac.

### Universal (Expo Go)

```bash
npx expo start
```

Scan the QR code with the Expo Go app on your phone. This is the fastest way to test on a physical device without a full native build, but some native modules (Vision Camera, TFLite) are not available in Expo Go. Use a development build for full functionality.

---

## 5. EAS Build (Cloud Builds — No Mac Needed)

EAS (Expo Application Services) builds your app in the cloud. This is the recommended way to get a native iOS or Android binary.

### First-time setup

```bash
npm install -g eas-cli
eas login
```

Log in with your Expo account. If you do not have one, create a free account at [expo.dev](https://expo.dev).

Verify the project configuration:

```bash
eas build:configure
```

This validates the `eas.json` file in the project root. The file is already committed to the repo with three build profiles configured.

### Build for iOS

```bash
eas build --platform ios --profile preview
```

What happens during the build:
1. EAS prompts for your Apple Developer credentials (Apple ID + app-specific password).
2. If this is your first build, EAS registers your device UDID for ad-hoc distribution.
3. The build runs in the cloud. Typical time: 10-15 minutes.
4. On completion, you receive a download link or QR code to install the `.ipa` on your device.

### Build for Android

```bash
eas build --platform android --profile preview
```

This produces an `.apk` file. You receive a download link when the build finishes. Install the APK on any Android device.

### Build Profiles

The `eas.json` file defines three profiles:

| Profile | Command | Use Case | Output |
|---------|---------|----------|--------|
| `development` | `eas build --profile development` | Dev client with hot reload and native module access | `.ipa` / `.apk` (debug) |
| `preview` | `eas build --profile preview` | Standalone app for internal testing | `.ipa` / `.apk` (ad-hoc) |
| `production` | `eas build --profile production` | App Store and Play Store release | `.ipa` / `.aab` (signed) |

The `production` profile has `autoIncrement` enabled, so the build number increases automatically with each build.

### Check build status

```bash
eas build:list
```

Or visit your project dashboard at [expo.dev](https://expo.dev).

---

## 6. Project Configuration

### app.json Overview

The app is configured in `app.json` under the `expo` key. Key settings:

| Setting | Value |
|---------|-------|
| Bundle ID (iOS) | `ai.digitalthread.resemble` |
| Package name (Android) | `ai.digitalthread.resemble` |
| UI style | `dark` |
| Orientation | `portrait` |
| Splash background | `#0a0a1a` |
| URL scheme | `resemble://` |

### Plugins

These Expo config plugins are registered in `app.json` and handle native module linking and permissions:

| Plugin | Purpose |
|--------|---------|
| `expo-router` | File-based routing (screens live in `app/` directory) |
| `expo-camera` | Camera access for face scanning |
| `expo-image-picker` | Photo library access for uploading face photos |
| `react-native-vision-camera` | Native camera with ML Kit frame processing |
| `react-native-fast-tflite` | TFLite model runtime with CoreML (iOS) and GPU (Android) delegates |
| `expo-sharing` | System share sheet for sharing results |

### Native Permissions

These permissions are declared in `app.json` and requested at runtime:

| Permission | Platform | Description |
|------------|----------|-------------|
| `NSCameraUsageDescription` | iOS | "Resemble needs camera access to scan your face for comparison" |
| `NSPhotoLibraryUsageDescription` | iOS | "Resemble needs photo access to load face photos for comparison" |
| `CAMERA` | Android | Camera access for face scanning |

---

## 7. Face Detection Models

### Web (Automatic)

On web, face detection uses face-api.js with models loaded from CDN on first use:
- SSD MobileNet (face detection)
- 68-point facial landmarks
- Face recognition embeddings

Total model size is approximately 50MB. Models are cached by the browser after the first load, so subsequent visits are fast.

### Native (Bundled)

On iOS and Android, face detection uses two systems:
- **MobileFaceNet** TFLite model at `assets/models/mobilefacenet.tflite` (5.2MB) for face embeddings.
- **Google ML Kit** Face Detection (bundled by the Vision Camera SDK, no manual download needed) for landmark detection.

Hardware acceleration:
- iOS: CoreML delegate (enabled in `app.json` via `react-native-fast-tflite` plugin)
- Android: GPU delegate via NNAPI (enabled in `app.json` via `react-native-fast-tflite` plugin)

---

## 8. Portless (Optional Dev URL Aliases)

Portless provides named HTTPS URLs for local development instead of bare `localhost:PORT` addresses.

### Install and start

```bash
npm install -g portless
portless proxy start --https
```

### Access the app

With portless running, `npm run web` registers the alias automatically and the app is available at:

```
https://resemble.localhost:1355
```

### Without portless

If you do not want to use portless, run the direct variant:

```bash
npm run web:direct
```

This starts the Expo web dev server on a random port without any alias registration.

---

## 9. Deployment

### Web — GitHub Pages

```bash
npx expo export --platform web
cp dist/index.html dist/404.html
npx gh-pages -d dist
```

The `cp` command creates a `404.html` that matches `index.html`. This is required for client-side routing to work on GitHub Pages (all routes need to serve the same HTML shell).

### Web — Vercel or Netlify

Connect the GitHub repository to your hosting provider and configure:

| Setting | Value |
|---------|-------|
| Build command | `npx expo export --platform web` |
| Output directory | `dist` |
| Node version | 18+ |

Add environment variables (like `EXPO_PUBLIC_GROQ_API_KEY`) in the hosting provider's dashboard.

### iOS — App Store

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

EAS Submit uploads the `.ipa` directly to App Store Connect. You need an Apple Developer account with an app record created in App Store Connect. Fill in the `appleId`, `ascAppId`, and `appleTeamId` fields in `eas.json` under `submit.production.ios` before submitting.

### Android — Google Play

```bash
eas build --platform android --profile production
eas submit --platform android
```

The production Android build produces an `.aab` (Android App Bundle), which is the required format for Google Play. You need a Google Play Developer account and a service account key configured in EAS.

---

## 10. Testing

### Type check

```bash
npx tsc --noEmit
```

This runs the TypeScript compiler in check-only mode. It reports type errors without producing output files. Fix any errors before committing.

### Web build verification

```bash
npx expo export --platform web
```

A successful build produces a `dist/` directory containing `index.html` and JavaScript bundles. If this command fails, the app has build errors that must be resolved before deployment.

### Manual testing checklist

- Open the web app and verify the landing page loads with hero section and feature cards.
- Navigate to Family mode, upload three photos (child + two parents), and confirm scores display.
- Navigate to Celebrity mode, upload a photo, and confirm celebrity matching works (requires Groq API key).
- Test the camera screen if running on a native build (not available in Expo Go or web).

---

## Checklist

Use this checklist to track your setup progress.

### Initial Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Repository cloned
- [ ] `npm install` completed without errors
- [ ] Web dev server runs (`npm run web`)
- [ ] Landing page loads in browser at localhost:4003

### Environment
- [ ] `.env.local` created with Groq API key (skip if not using celebrity mode)
- [ ] Verified `.env.local` is in `.gitignore`

### Native Builds
- [ ] EAS CLI installed (`eas --version`)
- [ ] Logged into Expo account (`eas whoami`)
- [ ] Apple Developer account configured (iOS only)
- [ ] `eas.json` submit fields filled in (`appleId`, `ascAppId`, `appleTeamId`)
- [ ] First iOS preview build completed (`eas build --platform ios --profile preview`)
- [ ] First Android preview build completed (`eas build --platform android --profile preview`)
- [ ] App installs and runs on a physical device

### Deployment
- [ ] Web export builds successfully (`npx expo export --platform web`)
- [ ] GitHub Pages or Vercel/Netlify deployment live
- [ ] iOS production build submitted to App Store Connect
- [ ] Android production build submitted to Google Play Console
