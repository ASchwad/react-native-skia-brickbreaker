import { Canvas, Circle, RoundedRect} from "@shopify/react-native-skia";
import React, { useState } from "react";
import { Button, StyleSheet, View } from "react-native";
import { BrickInterface, CircleInterface, ExplosionInterface, PaddleInterface, ShapeInterface, isCircle } from "./types";
import { useFrameCallback, useSharedValue, withSpring } from "react-native-reanimated";
import { createBouncingExample, resolveWallCollision } from "./logic";
import { animate } from "./logic";
import { BALL_COLOR, PADDLE_MIDDLE, RADIUS, height, width } from "./constants";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {Explosion} from "./explosion";

export default function App(){
  const circleObject : CircleInterface = {
    id: 1,
    x: useSharedValue(PADDLE_MIDDLE),
    y: useSharedValue(height - 200),
    m: 1,
    ax: 0,
    ay: 0,
    vx: 0,
    vy: 0,
    type: "Circle",
    r: useSharedValue(RADIUS),
  };
  
  const explosionObject : ExplosionInterface = {
  id: 1,
    x: useSharedValue(-500),
    y: useSharedValue(0),
    m: 1,
    ax: 0,
    ay: 0,
    vx: 0,
    vy: 0,
    opacity: useSharedValue(0),
    type: "Explosion",
    r: useSharedValue(RADIUS),
  };

  const paddleObject : PaddleInterface = {
    id: 2,
    x: useSharedValue(PADDLE_MIDDLE),
    y: useSharedValue(height - 100),
    m: 1,
    ax: 0,
    ay: 0,
    vx: 0,
    vy: 0,
    type: "Paddle",
    height: 50,
    width: 125,
  } 

  createBouncingExample(circleObject);

  const rows = 4;
  const columns = 3;
  const columnPadding = 85;
  const rowPadding = 30;
  const marginTop = 50;
  const marginLeft = 30;

  const bricks : BrickInterface[] = [];

  for(let i = 0; i < rows; i++){
    for(let j = 0; j < columns; j++){
      bricks.push({
        id: i * columns + j,
        x: useSharedValue(marginLeft + 50 * j + columnPadding * j),
        y: useSharedValue(marginTop + 50 * i + rowPadding * i),
        m: 1,
        ax: 0,
        ay: 0,
        vx: 0,
        vy: 0,
        type: "Brick",
        height: 50,
        width: 80,
        canCollide: useSharedValue(true),
      });
    }
  }

  useFrameCallback((frameInfo) => {
    if(!frameInfo.timeSincePreviousFrame) return;

    animate([circleObject, paddleObject, ...bricks], frameInfo.timeSincePreviousFrame, 0, explosionObject);
  })

  // const [explosionPosition, setExplosionPosition]= useState(120);
  const explosionPosition = useSharedValue(120);
  const gesture = Gesture.Pan().onChange(({x}) => {
    paddleObject.x.value = x - paddleObject.width / 2;
  });
  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Canvas style={{ flex: 1, backgroundColor: "black" }}>
          <Circle 
            // {...circleObject}
            cx={circleObject.x} 
            cy={circleObject.y} 
            r={circleObject.r}

            color={BALL_COLOR}
          />
          <Explosion {...explosionObject}/>
          {
            bricks.map((brick) => (
              <RoundedRect
                {...brick}
                r={10}
                color={"white"}
              />
            ))
          }
          <RoundedRect
            {...paddleObject}
            color={"white"}
            r={10}
          />
        </Canvas>
      </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  titleContainer: {
    flexDirection: "row",
  },
  titleTextNormal: {
    color: "white",
    fontSize: 40,
  },
  titleTextBold: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },
});
