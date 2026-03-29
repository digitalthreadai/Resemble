/**
 * ML Kit Face Contour → dlib 68-point Landmark Mapper
 *
 * Converts Google ML Kit's 133 contour points (spread across named groups)
 * into the standard dlib 68-point layout that the Resemble scoring engine expects.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  ML Kit Contour Groups          dlib 68-point Index Mapping          │
 * │  ─────────────────────          ──────────────────────────           │
 * │  FACE (36 pts)            ───►  0–16   jawline (17 pts, subsampled) │
 * │  RIGHT_EYEBROW_TOP (5)   ───►  17–21  right eyebrow                │
 * │  LEFT_EYEBROW_TOP (5)    ───►  22–26  left eyebrow                 │
 * │  NOSE_BRIDGE (2)         ───►  27–30  nose bridge (interpolated)    │
 * │  NOSE_BOTTOM (3)         ───►  31–35  nose tip (interpolated to 5) │
 * │                                 + nose tip pt (36th → dlib 30)      │
 * │  RIGHT_EYE (16)          ───►  36–41  right eye (6 pts)            │
 * │  LEFT_EYE (16)           ───►  42–47  left eye (6 pts)             │
 * │  UPPER_LIP_TOP (11) +                                              │
 * │  LOWER_LIP_BOTTOM (9)   ───►  48–59  outer lip (12 pts)           │
 * │  UPPER_LIP_BOTTOM (9) +                                            │
 * │  LOWER_LIP_TOP (9)      ───►  60–67  inner lip (8 pts)            │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * dlib 68-point face schematic:
 *
 *         17-21         22-26
 *        (R brow)      (L brow)
 *
 *       36──41         42──47
 *      (R eye)        (L eye)
 *
 *            27
 *            28         nose bridge
 *            29
 *            30
 *         31 32 33 34 35   nose bottom
 *
 *   0                        16
 *    1                      15
 *     2   48──────────59   14     jawline
 *      3  60──────────67  13
 *       4                12
 *        5  mouth       11
 *         6   7   8  9 10
 *
 * Pure TypeScript, no platform dependencies.
 */

import type { Point2D } from '../../engine';

// ── ML Kit Contour Types ─────────────────────────────────────────────────────

/** Named contour groups as returned by ML Kit Face Detection. */
export interface MLKitContours {
  FACE: Point2D[];                // 36 points
  RIGHT_EYEBROW_TOP: Point2D[];  // 5 points
  LEFT_EYEBROW_TOP: Point2D[];   // 5 points
  NOSE_BRIDGE: Point2D[];        // 2 points
  NOSE_BOTTOM: Point2D[];        // 3 points
  RIGHT_EYE: Point2D[];          // 16 points
  LEFT_EYE: Point2D[];           // 16 points
  UPPER_LIP_TOP: Point2D[];      // 11 points
  UPPER_LIP_BOTTOM: Point2D[];   // 9 points
  LOWER_LIP_TOP: Point2D[];      // 9 points
  LOWER_LIP_BOTTOM: Point2D[];   // 9 points
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Linearly interpolate between two points.
 * @param a Start point
 * @param b End point
 * @param t Interpolation factor (0 = a, 1 = b)
 */
function lerp(a: Point2D, b: Point2D, t: number): Point2D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Subsample an array of points to a target count using evenly spaced indices.
 * For a source array of length N and target count M, picks indices that are
 * evenly distributed across the source.
 */
function subsample(pts: Point2D[], targetCount: number): Point2D[] {
  if (pts.length === 0) return [];
  if (pts.length <= targetCount) return [...pts];

  const result: Point2D[] = [];
  for (let i = 0; i < targetCount; i++) {
    const srcIdx = Math.round((i * (pts.length - 1)) / (targetCount - 1));
    result.push(pts[srcIdx]);
  }
  return result;
}

/**
 * Interpolate a sparse set of points into a denser set by inserting
 * evenly spaced intermediate points along each segment.
 * @param pts Source points (at least 2)
 * @param targetCount Desired number of output points
 */
function interpolate(pts: Point2D[], targetCount: number): Point2D[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array(targetCount).fill(pts[0]);
  if (pts.length >= targetCount) return subsample(pts, targetCount);

  // Compute cumulative arc lengths
  const lengths: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLength = lengths[lengths.length - 1];

  // Edge case: all points are the same
  if (totalLength === 0) return Array(targetCount).fill(pts[0]);

  const result: Point2D[] = [];
  for (let i = 0; i < targetCount; i++) {
    const targetDist = (i / (targetCount - 1)) * totalLength;

    // Find segment containing this distance
    let seg = 0;
    while (seg < lengths.length - 2 && lengths[seg + 1] < targetDist) {
      seg++;
    }

    const segLength = lengths[seg + 1] - lengths[seg];
    const t = segLength > 0 ? (targetDist - lengths[seg]) / segLength : 0;
    result.push(lerp(pts[seg], pts[seg + 1], t));
  }
  return result;
}

/**
 * Compute the centroid (average) of a set of points.
 */
function centroid(pts: Point2D[]): Point2D {
  const sum = pts.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / pts.length, y: sum.y / pts.length };
}

// ── Sanity Check ─────────────────────────────────────────────────────────────

/**
 * Geometric sanity check on the resulting 68 landmarks.
 * Verifies basic spatial relationships that must hold for a valid face:
 *   - Eyes are above the mouth
 *   - Nose bridge is between the eyes (horizontally)
 *   - Nose is above the mouth
 * @returns true if landmarks pass all checks
 */
export function sanityCheck68(landmarks: Point2D[]): boolean {
  if (landmarks.length !== 68) return false;

  // Eye centers (dlib: right eye 36-41, left eye 42-47)
  const rightEyeCenter = centroid(landmarks.slice(36, 42));
  const leftEyeCenter = centroid(landmarks.slice(42, 48));
  const eyeMidpoint: Point2D = {
    x: (rightEyeCenter.x + leftEyeCenter.x) / 2,
    y: (rightEyeCenter.y + leftEyeCenter.y) / 2,
  };

  // Mouth center (dlib: outer lip 48-59)
  const mouthCenter = centroid(landmarks.slice(48, 60));

  // Nose tip (dlib point 30)
  const noseTip = landmarks[30];

  // Nose bridge top (dlib point 27)
  const noseBridgeTop = landmarks[27];

  // In image coordinates, y increases downward.
  // Eyes should be above (lower y) the mouth.
  if (eyeMidpoint.y >= mouthCenter.y) return false;

  // Nose bridge should be roughly between the eyes horizontally.
  const eyeMinX = Math.min(rightEyeCenter.x, leftEyeCenter.x);
  const eyeMaxX = Math.max(rightEyeCenter.x, leftEyeCenter.x);
  if (noseBridgeTop.x < eyeMinX - (eyeMaxX - eyeMinX) * 0.5) return false;
  if (noseBridgeTop.x > eyeMaxX + (eyeMaxX - eyeMinX) * 0.5) return false;

  // Nose tip should be above (lower y) the mouth center.
  if (noseTip.y >= mouthCenter.y) return false;

  return true;
}

// ── Main Mapper ──────────────────────────────────────────────────────────────

/**
 * Convert ML Kit face contour points to the dlib 68-point landmark format.
 *
 * @param contours Named contour groups from ML Kit Face Detection
 * @returns Array of exactly 68 Point2D in dlib order
 * @throws Error if required contour groups are missing or sanity check fails
 */
export function mlKitToDlib68(contours: MLKitContours): Point2D[] {
  // ── Validate required groups ───────────────────────────────────────────────

  const required: (keyof MLKitContours)[] = [
    'FACE',
    'RIGHT_EYEBROW_TOP',
    'LEFT_EYEBROW_TOP',
    'NOSE_BRIDGE',
    'NOSE_BOTTOM',
    'RIGHT_EYE',
    'LEFT_EYE',
    'UPPER_LIP_TOP',
    'UPPER_LIP_BOTTOM',
    'LOWER_LIP_TOP',
    'LOWER_LIP_BOTTOM',
  ];

  for (const key of required) {
    if (!contours[key] || contours[key].length === 0) {
      throw new Error(`mlKitToDlib68: missing or empty contour group "${key}"`);
    }
  }

  const landmarks: Point2D[] = [];

  // ── 0–16: Jawline (17 points from FACE 36 pts) ────────────────────────────
  // ML Kit FACE contour traces the full face outline. Subsample to 17 points
  // for the dlib jawline (ear to ear across the chin).
  const jawline = subsample(contours.FACE, 17);
  landmarks.push(...jawline); // indices 0-16

  // ── 17–21: Right eyebrow (5 points) ────────────────────────────────────────
  landmarks.push(...contours.RIGHT_EYEBROW_TOP.slice(0, 5)); // indices 17-21

  // ── 22–26: Left eyebrow (5 points) ─────────────────────────────────────────
  landmarks.push(...contours.LEFT_EYEBROW_TOP.slice(0, 5)); // indices 22-26

  // ── 27–30: Nose bridge (4 points from 2 ML Kit points) ────────────────────
  // ML Kit gives only top and bottom of bridge; interpolate to 4 evenly spaced.
  const noseBridge = interpolate(contours.NOSE_BRIDGE, 4);
  landmarks.push(...noseBridge); // indices 27-30

  // ── 31–35: Nose bottom (5 points from 3 ML Kit points) ────────────────────
  // dlib has 5 points across the nose bottom (nostril to nostril + tip).
  // ML Kit NOSE_BOTTOM has 3 points: left, center, right.
  // Interpolate to 5 for dlib indices 31-35.
  const noseBottom = interpolate(contours.NOSE_BOTTOM, 5);
  landmarks.push(...noseBottom); // indices 31-35

  // ── 36–41: Right eye (6 points from 16 ML Kit points) ─────────────────────
  // ML Kit traces the full eye contour with 16 points (top + bottom arc).
  // dlib uses 6 points: corners + top/bottom midpoints.
  // Pick: 0 (outer corner), 2-3 (top), 8 (inner corner), 11-12 (bottom)
  const re = contours.RIGHT_EYE;
  if (re.length >= 16) {
    landmarks.push(
      re[0],                         // 36: outer corner
      re[Math.round(16 * 1 / 6)],   // 37: top-outer (~index 2-3)
      re[Math.round(16 * 2 / 6)],   // 38: top-inner (~index 5)
      re[8],                         // 39: inner corner
      re[Math.round(16 * 4 / 6)],   // 40: bottom-inner (~index 10-11)
      re[Math.round(16 * 5 / 6)],   // 41: bottom-outer (~index 13)
    );
  } else {
    landmarks.push(...subsample(re, 6));
  }

  // ── 42–47: Left eye (6 points from 16 ML Kit points) ──────────────────────
  const le = contours.LEFT_EYE;
  if (le.length >= 16) {
    landmarks.push(
      le[0],                         // 42: inner corner
      le[Math.round(16 * 1 / 6)],   // 43: top-inner (~index 2-3)
      le[Math.round(16 * 2 / 6)],   // 44: top-outer (~index 5)
      le[8],                         // 45: outer corner
      le[Math.round(16 * 4 / 6)],   // 46: bottom-outer (~index 10-11)
      le[Math.round(16 * 5 / 6)],   // 47: bottom-inner (~index 13)
    );
  } else {
    landmarks.push(...subsample(le, 6));
  }

  // ── 48–59: Outer lip (12 points) ──────────────────────────────────────────
  // Combine UPPER_LIP_TOP (left-to-right, 11 pts) and LOWER_LIP_BOTTOM
  // (right-to-left, 9 pts) to form the outer lip contour, then subsample to 12.
  const outerLip = [
    ...contours.UPPER_LIP_TOP,
    ...contours.LOWER_LIP_BOTTOM,
  ];
  landmarks.push(...subsample(outerLip, 12)); // indices 48-59

  // ── 60–67: Inner lip (8 points) ───────────────────────────────────────────
  // Combine UPPER_LIP_BOTTOM (left-to-right, 9 pts) and LOWER_LIP_TOP
  // (right-to-left, 9 pts) to form the inner lip contour, then subsample to 8.
  const innerLip = [
    ...contours.UPPER_LIP_BOTTOM,
    ...contours.LOWER_LIP_TOP,
  ];
  landmarks.push(...subsample(innerLip, 8)); // indices 60-67

  // ── Validate total count ───────────────────────────────────────────────────
  if (landmarks.length !== 68) {
    throw new Error(
      `mlKitToDlib68: expected 68 landmarks, produced ${landmarks.length}`,
    );
  }

  // ── Geometric sanity check ─────────────────────────────────────────────────
  if (!sanityCheck68(landmarks)) {
    throw new Error(
      'mlKitToDlib68: landmarks failed geometric sanity check ' +
        '(eyes must be above mouth, nose between eyes)',
    );
  }

  return landmarks;
}
