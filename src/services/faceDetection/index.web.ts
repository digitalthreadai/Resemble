/**
 * Web face detection using face-api.js loaded from CDN.
 * Same approach as the original familyface PWA.
 *
 * Pipeline:
 *   loadScript(CDN) → loadModels(CDN/weights) → ready
 *   detectFromImage(uri) → HTMLImage → faceapi.detectSingleFace()
 *     → landmarks.positions (68 pts, dlib order) + descriptor (128D)
 */

import type { Point2D } from '../../engine';
import type { FaceDetectionService, FaceDetectionResult } from './types';

const MODEL_URLS = [
  'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights',
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',
];

const SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';

let _ready = false;

function getFaceApi(): any {
  return (window as any).faceapi;
}

async function loadScript(): Promise<void> {
  if (getFaceApi()) return;

  // First check if CDN is reachable
  try {
    const resp = await fetch(SCRIPT_URL, { method: 'HEAD' });
    if (!resp.ok) throw new Error(`CDN returned ${resp.status}`);
  } catch (err: any) {
    throw new Error(`Cannot reach face-api.js CDN: ${err.message}. Check your internet connection.`);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // Give the script a moment to initialize window.faceapi
      setTimeout(() => {
        if (getFaceApi()) {
          resolve();
        } else {
          reject(new Error('face-api.js loaded but faceapi not available on window'));
        }
      }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load face-api.js script from CDN'));
    document.head.appendChild(script);
  });
}

async function loadModels(): Promise<void> {
  const faceapi = getFaceApi();
  if (!faceapi) throw new Error('face-api.js not loaded');

  let lastError: Error | null = null;

  for (const url of MODEL_URLS) {
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(url),
        faceapi.nets.faceLandmark68Net.loadFromUri(url),
        faceapi.nets.faceRecognitionNet.loadFromUri(url),
      ]);
      return; // success
    } catch (err: any) {
      lastError = err;
      console.warn(`Model load failed from ${url}, trying fallback...`);
    }
  }

  throw lastError ?? new Error('All model CDN sources failed');
}

function uriToImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for face detection'));
    img.src = uri;
  });
}

export const webFaceDetection: FaceDetectionService = {
  async initialize(): Promise<void> {
    if (_ready) return;

    await loadScript();

    // Retry model loading with exponential backoff
    const delays = [0, 1000, 2000, 4000];
    for (let attempt = 0; attempt < delays.length; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, delays[attempt]));
        await loadModels();
        _ready = true;
        return;
      } catch (err) {
        if (attempt === delays.length - 1) throw err;
        console.warn(`Model load attempt ${attempt + 1} failed, retrying...`);
      }
    }
  },

  async detectFromImage(uri: string): Promise<FaceDetectionResult> {
    if (!_ready) throw new Error('Face detection models not loaded');

    const faceapi = getFaceApi();
    const img = await uriToImage(uri);

    const detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('NO_FACE_DETECTED');
    }

    const positions = detection.landmarks.positions;
    const landmarks: Point2D[] = positions.map((p: any) => ({
      x: p.x,
      y: p.y,
    }));

    const box = detection.detection.box;

    return {
      landmarks,
      descriptor: detection.descriptor,
      boundingBox: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      confidence: detection.detection.score,
      platform: 'web',
    };
  },

  isReady(): boolean {
    return _ready;
  },

  dispose(): void {
    _ready = false;
  },
};

export default webFaceDetection;
