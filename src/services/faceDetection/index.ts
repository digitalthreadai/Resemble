/**
 * Platform-agnostic barrel export.
 * Metro resolves index.web.ts on web and index.native.ts on native.
 * This file serves as fallback / type reference.
 */
export { default } from './index.native';
export type { FaceDetectionService, FaceDetectionResult } from './types';
