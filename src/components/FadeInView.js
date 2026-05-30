import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * FadeInView provides a hardware-accelerated, high-performance,
 * smooth fade-in and subtle slide-up animation on mount and on screen focus.
 * Perfect for premium page transitions across all navigators.
 */
export default function FadeInView({ children, style, duration = 300, delay = 0 }) {
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (isFocused) {
      // Reset values back to start
      fadeAnim.setValue(0);
      translateYAnim.setValue(15);

      // Animate smoothly to finished state
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
