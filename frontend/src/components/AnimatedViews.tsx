import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface FadeInViewProps {
  style?: StyleProp<ViewStyle>;
  duration?: number;
  delay?: number;
  children: React.ReactNode;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  style,
  duration = 500,
  delay = 0,
  children,
}) => {
  // Use useRef to persist the Animated.Value across re-renders
  // Initialize to 1 to ensure visibility on re-renders
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Always ensure opacity is 1 (visible)
    opacity.setValue(1);
  }, [opacity]);

  return (
    <Animated.View style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
};

interface ScaleInViewProps extends FadeInViewProps {
  initialScale?: number;
}

export const ScaleInView: React.FC<ScaleInViewProps> = ({
  style,
  duration = 500,
  delay = 0,
  initialScale = 0.9,
  children,
}) => {
  // Use useRef to persist the Animated.Values across re-renders
  // Initialize to 1 to ensure visibility on re-renders
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Always ensure visible and scaled
    scale.setValue(1);
    opacity.setValue(1);
  }, [scale, opacity]);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};