import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Defs,
  Mask,
  Rect,
  Ellipse,
  LinearGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GUIDE_WIDTH = SCREEN_WIDTH;
const GUIDE_HEIGHT = GUIDE_WIDTH * (4 / 3);

/**
 * The FaceID-style oval guide overlay for the camera viewfinder.
 * Dark overlay with a transparent oval cutout + gradient border.
 */
export function FaceOvalGuide({ scanning = false }: { scanning?: boolean }) {
  const cx = GUIDE_WIDTH / 2;
  const cy = GUIDE_HEIGHT * 0.44;
  const rx = GUIDE_WIDTH * 0.32;
  const ry = GUIDE_HEIGHT * 0.30;

  return (
    <View style={[styles.container, { width: GUIDE_WIDTH, height: GUIDE_HEIGHT }]} pointerEvents="none">
      <Svg width={GUIDE_WIDTH} height={GUIDE_HEIGHT}>
        <Defs>
          <Mask id="oval-mask">
            <Rect width={GUIDE_WIDTH} height={GUIDE_HEIGHT} fill="white" />
            <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
          </Mask>
          <LinearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7c3aed" />
            <Stop offset="50%" stopColor="#a855f7" />
            <Stop offset="100%" stopColor="#6366f1" />
          </LinearGradient>
        </Defs>
        {/* Dark overlay with oval cutout */}
        <Rect
          width={GUIDE_WIDTH}
          height={GUIDE_HEIGHT}
          fill="rgba(0,0,0,0.55)"
          mask="url(#oval-mask)"
        />
        {/* Oval border ring */}
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={scanning ? 4 : 2.5}
          opacity={scanning ? 1 : 0.6}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
