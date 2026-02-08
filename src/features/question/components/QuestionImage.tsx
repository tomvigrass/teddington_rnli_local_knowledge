import React, { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image, ImageSource } from 'expo-image';
import { colors } from '../../../core/constants/colors';
import { spacing, borderRadius } from '../../../core/constants/spacing';

interface QuestionImageProps {
  source: ImageSource;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_SCALE = 5;
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.8;

export function QuestionImage({ source }: QuestionImageProps) {
  const [expanded, setExpanded] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const current = useRef({ scale: 1, tx: 0, ty: 0 });
  const pinchBase = useRef({ scale: 1, tx: 0, ty: 0 });
  const panBase = useRef({ tx: 0, ty: 0 });

  const resetZoom = () => {
    scaleAnim.setValue(1);
    translateXAnim.setValue(0);
    translateYAnim.setValue(0);
    current.current = { scale: 1, tx: 0, ty: 0 };
  };

  const closeModal = () => {
    setExpanded(false);
    resetZoom();
  };

  // Clamp translation so the image can't be dragged off-screen.
  // When scale <= 1, center the image (tx/ty = 0).
  // When zoomed in, allow panning but keep the image covering the viewport.
  const clamp = (tx: number, ty: number, scale: number) => {
    if (scale <= 1) return { tx: 0, ty: 0 };
    const contentWidth = SCREEN_WIDTH - spacing.md * 2;
    const maxTx = (contentWidth * (scale - 1)) / 2;
    const maxTy = (MODAL_HEIGHT * (scale - 1)) / 2;
    return {
      tx: Math.max(-maxTx, Math.min(maxTx, tx)),
      ty: Math.max(-maxTy, Math.min(maxTy, ty)),
    };
  };

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
      const imageX = (event.focalX - pinchBase.current.tx) / pinchBase.current.scale;
      const imageY = (event.focalY - pinchBase.current.ty) / pinchBase.current.scale;
      apply(newScale, event.focalX - imageX * newScale, event.focalY - imageY * newScale);
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
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

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (current.current.scale <= 1.05) {
      closeModal();
    }
  });

  const gesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(tapGesture),
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setExpanded(true)}
        activeOpacity={0.9}
        accessibilityRole="image"
        accessibilityLabel="Question image, tap to expand"
      >
        <Image
          source={source}
          style={styles.thumbnail}
          contentFit="contain"
          transition={200}
        />
      </TouchableOpacity>

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeModal}
            accessibilityRole="button"
            accessibilityLabel="Close image"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.closeButtonCircle}>
              <Animated.Text style={styles.closeButtonText}>✕</Animated.Text>
            </View>
          </TouchableOpacity>

          <GestureDetector gesture={gesture}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    { translateX: translateXAnim },
                    { translateY: translateYAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <Image
                source={source}
                style={styles.fullImage}
                contentFit="contain"
                transition={200}
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH,
    height: MODAL_HEIGHT,
    padding: spacing.md,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 20,
  },
});
