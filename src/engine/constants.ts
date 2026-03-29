/**
 * Facial landmark regions and weights — ported from the original Resemble web app.
 * Uses 68-point landmark model (dlib / face-api.js standard).
 */

export interface FeatureRegion {
  key: string;
  label: string;
  emoji: string;
  indices: number[];
  note: string;
}

export const FEATURES: FeatureRegion[] = [
  {
    key: 'eyes',
    label: 'Eyes',
    emoji: '\u{1F441}\uFE0F',
    indices: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
    note: '12 landmark pts — eye shape & lid curvature',
  },
  {
    key: 'eyebrows',
    label: 'Eyebrows',
    emoji: '\u3030\uFE0F',
    indices: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    note: '10 landmark pts — arch height & shape',
  },
  {
    key: 'nose',
    label: 'Nose',
    emoji: '\u{1F443}',
    indices: [27, 28, 29, 30, 31, 32, 33, 34, 35],
    note: '9 landmark pts — bridge, tip & nostril width',
  },
  {
    key: 'mouth',
    label: 'Lips & Mouth',
    emoji: '\u{1F444}',
    indices: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67],
    note: '20 landmark pts — lip shape, cupid\'s bow & width',
  },
  {
    key: 'jawline',
    label: 'Face Shape',
    emoji: '\u{1F537}',
    indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    note: '17 landmark pts — jawline width & chin shape',
  },
];

export const FEATURE_WEIGHTS: Record<string, number> = {
  eyes: 0.25,
  nose: 0.25,
  mouth: 0.20,
  jawline: 0.15,
  eyebrows: 0.15,
};
