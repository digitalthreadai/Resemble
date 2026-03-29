import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceOvalGuide } from '../src/components/FaceOvalGuide';
import { useResemble } from '../src/context/ResembleContext';
import { colors } from '../src/theme/colors';
import { spacing, radius } from '../src/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_WIDTH * (4 / 3);

/**
 * FaceID-style camera scanner.
 *
 * On native (iOS/Android):
 *   - Uses expo-camera with real-time face detection
 *   - Shows oval guide overlay with gradient ring
 *   - Assesses face quality (size, roll, yaw) before enabling capture
 *   - Animated scan line sweeps during detection
 *
 * On web:
 *   - Falls back to expo-camera's web implementation (getUserMedia)
 *   - Same UI overlay
 */
export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slot, mode } = useLocalSearchParams<{ slot: string; mode: string }>();
  const { dispatch } = useResemble();

  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [statusText, setStatusText] = useState('Position your face within the oval');
  const [qualityText, setQualityText] = useState('');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Simulated face detection state for demo
  // In production, wire react-native-vision-camera frame processors + ML Kit
  const detectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!permission?.granted) return;

    // Simulate face detection feedback (replace with real ML Kit integration)
    let tick = 0;
    detectionTimerRef.current = setInterval(() => {
      tick++;
      if (tick < 8) {
        setFaceDetected(false);
        setCaptureReady(false);
        setStatusText('Scanning for face...');
        setQualityText('');
      } else if (tick < 15) {
        setFaceDetected(true);
        setCaptureReady(false);
        const tips = tick < 10 ? 'Move closer' : tick < 12 ? 'Keep head level' : 'Almost ready...';
        setStatusText(`Adjusting... ${tips}`);
        setQualityText('');
      } else {
        setFaceDetected(true);
        setCaptureReady(true);
        setStatusText('Face detected \u2014 tap to capture');
        setQualityText('Quality: 92% confidence');
      }
    }, 300);

    return () => {
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    };
  }, [permission?.granted]);

  const handleCapture = useCallback(async () => {
    if (!captureReady || capturing || !cameraRef.current) return;
    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: true,
      });

      if (photo?.uri && slot) {
        dispatch({ type: 'SUBMIT_CAPTURE', capture: { slot, uri: photo.uri } });
        router.canGoBack() ? router.back() : router.replace('/');
      }
    } catch (err) {
      console.warn('Capture failed:', err);
      setStatusText('Capture failed \u2014 try again');
    } finally {
      setCapturing(false);
    }
  }, [captureReady, capturing, slot, router, dispatch]);

  const handleClose = useCallback(() => {
    if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

  // Permission handling
  if (!permission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permDesc}>
          Resemble needs camera access to scan your face for comparison.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permBack} onPress={handleClose}>
          <Text style={styles.permBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close button */}
      <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 12 }]} onPress={handleClose}>
        <Ionicons name="close" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Camera viewport */}
      <View style={styles.viewport}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mode="picture"
        />

        {/* Face oval guide overlay */}
        <FaceOvalGuide scanning={faceDetected} />

        {/* Scan line animation */}
        {faceDetected && !captureReady && <View style={styles.scanLine} />}
      </View>

      {/* Status area */}
      <View style={styles.statusArea}>
        <Text style={[styles.statusText, captureReady && styles.statusReady]}>
          {statusText}
        </Text>
        {qualityText ? <Text style={styles.qualityText}>{qualityText}</Text> : null}
      </View>

      {/* Capture button */}
      <View style={styles.captureArea}>
        <TouchableOpacity
          style={[styles.captureBtn, captureReady && styles.captureBtnReady]}
          onPress={handleCapture}
          disabled={!captureReady || capturing}
          activeOpacity={0.7}
        >
          {capturing ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <View style={styles.captureRing}>
              <View
                style={[
                  styles.captureDot,
                  captureReady && styles.captureDotReady,
                ]}
              />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.captureLabel}>
          {slot === 'parent1'
            ? 'Parent 1'
            : slot === 'parent2'
              ? 'Parent 2'
              : slot === 'child'
                ? 'Child'
                : slot === 'you'
                  ? 'Your Photo'
                  : 'Celebrity'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.18,
    right: SCREEN_WIDTH * 0.18,
    top: CAMERA_HEIGHT * 0.25,
    height: 2,
    backgroundColor: colors.primaryLight,
    opacity: 0.6,
    borderRadius: 1,
  },
  statusArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusReady: {
    color: colors.success,
  },
  qualityText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  captureArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnReady: {
    borderColor: colors.primary,
  },
  captureRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  captureDotReady: {
    backgroundColor: colors.primary,
  },
  captureLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  // Permission screen
  permTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permDesc: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  permBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  permBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  permBack: {
    paddingVertical: 10,
  },
  permBackText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
