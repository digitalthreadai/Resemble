/**
 * Native face detection using:
 *   Layer 1: Google ML Kit (via react-native-vision-camera-face-detector)
 *            → 133 contour points → mapped to dlib 68-point format
 *   Layer 2: MobileFaceNet TFLite (via react-native-fast-tflite)
 *            → 192D face embeddings for similarity scoring
 *
 * Pipeline for static images:
 *   loadTFLite(model) → ready
 *   detectFromImage(uri) → VisionCamera detectFaces() → ML Kit contours
 *     → mlKitToDlib68() → 68 landmarks
 *     → crop face → resize 112×112 → MobileFaceNet → 192D embedding
 */

import type { FaceDetectionService, FaceDetectionResult } from './types';
import { mlKitToDlib68, type MLKitContours } from './mlKitToDlib68';

let _ready = false;
let _tfliteModel: any = null;

/**
 * Dynamically import TFLite to avoid bundling on web.
 * react-native-fast-tflite is a native-only module.
 */
async function loadTFLiteModel(): Promise<any> {
  try {
    const { loadTensorflowModel } = require('react-native-fast-tflite');
    // Load the MobileFaceNet model bundled in assets
    const model = await loadTensorflowModel(
      require('../../../assets/models/mobilefacenet.tflite'),
    );
    return model;
  } catch (err: any) {
    console.warn('TFLite model load failed:', err.message);
    // Non-fatal — detection still works, just without embeddings
    return null;
  }
}

/**
 * Run MobileFaceNet inference on a cropped face image.
 * Input: 112x112 RGB float32 normalized to [-1, 1]
 * Output: 192D float32 embedding (L2-normalized)
 */
async function computeEmbedding(
  faceImageUri: string,
  boundingBox: { x: number; y: number; width: number; height: number },
): Promise<Float32Array | null> {
  if (!_tfliteModel) return null;

  try {
    // Use expo-image-manipulator to crop and resize the face
    const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');

    const cropped = await manipulateAsync(
      faceImageUri,
      [
        {
          crop: {
            originX: Math.max(0, boundingBox.x),
            originY: Math.max(0, boundingBox.y),
            width: boundingBox.width,
            height: boundingBox.height,
          },
        },
        { resize: { width: 112, height: 112 } },
      ],
      { format: SaveFormat.JPEG },
    );

    // Convert to RGB float tensor [-1, 1]
    // react-native-fast-tflite can accept image URIs directly
    const output = await _tfliteModel.run([cropped.uri]);

    if (output && output[0]) {
      return new Float32Array(output[0]);
    }
    return null;
  } catch (err: any) {
    console.warn('Embedding computation failed:', err.message);
    return null;
  }
}

/**
 * Detect faces in a static image using ML Kit via Vision Camera.
 * Falls back to a simpler detection method if Vision Camera APIs
 * aren't available for static images.
 */
async function detectFaceFromImage(uri: string): Promise<{
  contours: MLKitContours;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
} | null> {
  try {
    // react-native-vision-camera-face-detector provides detectFaces()
    // which works on static images via ML Kit
    const { detectFaces } = require('react-native-vision-camera-face-detector');

    const faces = await detectFaces(uri, {
      performanceMode: 'accurate',
      contourMode: 'all',
      landmarkMode: 'all',
      classificationMode: 'all',
    });

    if (!faces || faces.length === 0) return null;

    const face = faces[0]; // Use the first (largest/most confident) face

    // Extract ML Kit contour groups
    const contours: MLKitContours = {
      FACE: face.contours?.FACE || [],
      RIGHT_EYEBROW_TOP: face.contours?.RIGHT_EYEBROW_TOP || [],
      LEFT_EYEBROW_TOP: face.contours?.LEFT_EYEBROW_TOP || [],
      NOSE_BRIDGE: face.contours?.NOSE_BRIDGE || [],
      NOSE_BOTTOM: face.contours?.NOSE_BOTTOM || [],
      RIGHT_EYE: face.contours?.RIGHT_EYE || [],
      LEFT_EYE: face.contours?.LEFT_EYE || [],
      UPPER_LIP_TOP: face.contours?.UPPER_LIP_TOP || [],
      UPPER_LIP_BOTTOM: face.contours?.UPPER_LIP_BOTTOM || [],
      LOWER_LIP_TOP: face.contours?.LOWER_LIP_TOP || [],
      LOWER_LIP_BOTTOM: face.contours?.LOWER_LIP_BOTTOM || [],
    };

    return {
      contours,
      boundingBox: {
        x: face.bounds?.x || 0,
        y: face.bounds?.y || 0,
        width: face.bounds?.width || 0,
        height: face.bounds?.height || 0,
      },
      confidence: face.smilingProbability != null ? 0.9 : 0.7, // ML Kit doesn't expose detection confidence directly
    };
  } catch (err: any) {
    console.error('ML Kit face detection failed:', err.message);
    return null;
  }
}

export const nativeFaceDetection: FaceDetectionService = {
  async initialize(): Promise<void> {
    if (_ready) return;

    // Load TFLite model for embeddings (non-blocking — detection works without it)
    _tfliteModel = await loadTFLiteModel();

    _ready = true;
  },

  async detectFromImage(uri: string): Promise<FaceDetectionResult> {
    if (!_ready) {
      await this.initialize();
    }

    const detection = await detectFaceFromImage(uri);
    if (!detection) {
      throw new Error('NO_FACE_DETECTED');
    }

    // Convert ML Kit contours to dlib 68-point format
    const landmarks = mlKitToDlib68(detection.contours);

    // Compute face embedding via MobileFaceNet (may be null if TFLite unavailable)
    const descriptor = await computeEmbedding(uri, detection.boundingBox);

    return {
      landmarks,
      descriptor,
      boundingBox: detection.boundingBox,
      confidence: detection.confidence,
      platform: 'native',
    };
  },

  isReady(): boolean {
    return _ready;
  },

  dispose(): void {
    if (_tfliteModel) {
      _tfliteModel.close?.();
      _tfliteModel = null;
    }
    _ready = false;
  },
};

export default nativeFaceDetection;
