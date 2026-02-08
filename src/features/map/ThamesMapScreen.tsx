import React, { useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image, ImageLoadEventData } from 'expo-image';
import { colors } from '../../core/constants/colors';

const screenWidth = Dimensions.get('window').width;
const MAX_SCALE = 5;

const mapSource = require('../../../assets/images/map/map.webp');

export function ThamesMapScreen() {
  const [imageHeight, setImageHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Always-current transform values (mirrors what's in the Animated.Values)
  const current = useRef({ scale: 1, tx: 0, ty: 0 });
  // Snapshot at gesture start
  const pinchBase = useRef({ scale: 1, tx: 0, ty: 0 });
  const panBase = useRef({ tx: 0, ty: 0 });

  const computedHeight = imageHeight || screenWidth * 3;
  const vpHeight = viewportHeight || Dimensions.get('window').height;

  const handleLoad = (event: ImageLoadEventData) => {
    const { width, height } = event.source;
    if (width > 0) {
      setImageHeight(screenWidth * (height / width));
    }
  };

  // With transformOrigin 'left top', image spans (tx, ty) to (tx + W*s, ty + H*s).
  // Clamp so the image always covers the viewport.
  const clamp = (tx: number, ty: number, scale: number) => ({
    tx: Math.max(screenWidth * (1 - scale), Math.min(0, tx)),
    ty: Math.max(vpHeight - computedHeight * scale, Math.min(0, ty)),
  });

  const apply = (scale: number, tx: number, ty: number) => {
    const c = clamp(tx, ty, scale);
    scaleAnim.setValue(scale);
    translateXAnim.setValue(c.tx);
    translateYAnim.setValue(c.ty);
    current.current = { scale, tx: c.tx, ty: c.ty };
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      pinchBase.current = { ...current.current };
    })
    .onUpdate((event) => {
      const newScale = Math.min(MAX_SCALE, Math.max(1, pinchBase.current.scale * event.scale));
      // Keep the focal point stationary: solve for translation that maps
      // the same image point back to the same screen coordinate.
      const imageX = (event.focalX - pinchBase.current.tx) / pinchBase.current.scale;
      const imageY = (event.focalY - pinchBase.current.ty) / pinchBase.current.scale;
      apply(newScale, event.focalX - imageX * newScale, event.focalY - imageY * newScale);
    });

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      panBase.current = { tx: current.current.tx, ty: current.current.ty };
    })
    .onUpdate((event) => {
      apply(
        current.current.scale,
        panBase.current.tx + event.translationX,
        panBase.current.ty + event.translationY,
      );
    });

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={{
            width: screenWidth,
            height: computedHeight,
            transformOrigin: 'left top',
            transform: [
              { translateX: translateXAnim },
              { translateY: translateYAnim },
              { scale: scaleAnim },
            ],
          }}
        >
          <Image
            source={mapSource}
            style={[styles.image, { height: computedHeight }]}
            contentFit="contain"
            onLoad={handleLoad}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  image: {
    width: screenWidth,
  },
});
