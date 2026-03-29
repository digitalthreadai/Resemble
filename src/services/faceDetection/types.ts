import type { Point2D } from '../../engine';

export interface FaceDetectionResult {
  /** 68-point dlib landmarks (normalized or raw pixel coords) */
  landmarks: Point2D[];
  /**
   * Face embedding vector for similarity comparison.
   * Web: 128D from face-api.js FaceNet
   * Native: 192D from MobileFaceNet TFLite
   * null if embedding model unavailable
   */
  descriptor: Float32Array | null;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  platform: 'web' | 'native';
}

export interface FaceDetectionService {
  initialize(): Promise<void>;
  detectFromImage(uri: string): Promise<FaceDetectionResult>;
  isReady(): boolean;
  dispose(): void;
}
