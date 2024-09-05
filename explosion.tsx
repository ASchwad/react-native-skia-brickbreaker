import {useEffect} from "react";
import {Canvas, Circle, Group} from "@shopify/react-native-skia";
import Animated, {
    SharedValue,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import React from "react";
import { ExplosionInterface } from "./types";
 
export const Explosion : React.FC<ExplosionInterface> = ({x, y, opacity}) => {
  const size = 30;
  const r = useDerivedValue(() => withRepeat(
    withTiming(size, { duration: 1000 }), -1), [x]);
  const animatedOpacity = useDerivedValue(() => withSequence(
    withTiming(1 + x.value / 1000000, { duration: 200 }),
    withTiming(0, { duration: 200 })), [x]);
  
  const animatedx = useDerivedValue(() => x.value + size, [x]);
  const animatedy = useDerivedValue(() => y.value + size / 2, [y]);

  return (
      <Group blendMode="multiply">
        <Circle
          cx={animatedx}
          cy={animatedy}
          r={r}
          opacity={animatedOpacity}
          color="yellow"
        />
        <Circle
          cx={useDerivedValue(() => animatedx.value + Math.random() * 50)} 
          cy={useDerivedValue(() => animatedy.value + Math.random() * 55)}
          r={r}
          opacity={useDerivedValue(() => withSpring(animatedOpacity.value))}
          color="yellow"
        />
        <Circle
          cx={useDerivedValue(() => animatedx.value + Math.random() * 55)} 
          cy={useDerivedValue(() => animatedy.value + Math.random() * 50)}
          r={r}
          opacity={useDerivedValue(() => withSpring(animatedOpacity.value))}
          color="orange"
        />
      </Group>
  );
};