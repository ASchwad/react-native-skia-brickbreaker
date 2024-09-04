import { SharedValue, withTiming } from "react-native-reanimated";
import { MAX_SPEED, RADIUS, height, width } from "./constants";
import { BrickInterface, CircleInterface, Collision, ExplosionInterface, PaddleInterface, ShapeInterface, isCircle, isExplosion } from "./types";

export const createBouncingExample = (circleObject: CircleInterface) => {
    "worklet";
    
    circleObject.r.value = RADIUS;
    circleObject.vx = 0;
    circleObject.vy = 0;
    circleObject.ax = 0.5;
    circleObject.ay = 1;
};

// Source: https://www.jeffreythompson.org/collision-detection/table_of_contents.php
function circleRect(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ) {
    "worklet";
    // temporary variables to set edges for testing
    let testX = cx;
    let testY = cy;
  
    // which edge is closest?
    if (cx < rx) testX = rx; // test left edge
    else if (cx > rx + rw) testX = rx + rw; // right edge
    if (cy < ry) testY = ry; // top edge
    else if (cy > ry + rh) testY = ry + rh; // bottom edge
  
    // get distance from closest edges
    let distX = cx - testX;
    let distY = cy - testY;
    let distance = Math.sqrt(distX * distX + distY * distY);
  
    // if the distance is less than the radius, collision!
    if (distance <= RADIUS) {
      return true;
    }
    return false;
  }

export const resolveWallCollision = (object: CircleInterface, width: number, height: number) => {
    "worklet";
    
    // right wall collision
    if(object.x.value + object.r.value > width){
        object.x.value = width - object.r.value;
        object.vx *= -1;
        object.ax *= -1;
    }
    // left wall collision
    if(object.x.value - object.r.value < 0){
        object.x.value = 0 + object.r.value;
        object.vx *= -1;
        object.ax *= -1;
    }
    // bottom wall collision
    if(object.y.value + object.r.value > height){
        object.y.value = height - object.r.value;
        object.vy *= -1;
        object.ay *= -1;
    }
    // top wall collision
    if(object.y.value - object.r.value < 0){
        object.y.value = 0 + object.r.value;
        object.vy *= -1;
        object.ay *= -1;
    }
}

export const checkCollision = (o1 : ShapeInterface, o2 : ShapeInterface) => {
    "worklet";

    const dx = o1.x.value - o2.x.value;
    const dy = o1.y.value - o2.y.value;
    // euclidean distance
    const d = Math.sqrt(dx * dx + dy * dy);

    if(o1.type === "Circle" && o2.type === "Paddle"){
        const circle = o1 as CircleInterface;
        const paddle = o2 as PaddleInterface;
        
        const isCollision = circleRect(circle.x.value, circle.y.value, paddle.x.value, paddle.y.value, paddle.width, paddle.height);
        if(isCollision){
            return {
                collided: true,
                collisionInfo: {
                    o1, o2, dx, dy, d
                }
            }
        }
    }
    if(o1.type === "Circle" && o2.type === "Brick"){
        const circle = o1 as CircleInterface;
        const paddle = o2 as BrickInterface;
        
        const isCollision = circleRect(circle.x.value, circle.y.value, paddle.x.value, paddle.y.value, paddle.width, paddle.height);
        if(isCollision){
            return {
                collided: true,
                collisionInfo: {
                    o1, o2, dx, dy, d
                },
                shouldExplode: true
            }
        }
    }
    return {
        collided: false,
        collisionInfo: null
    }
}

const resolveCollisionWithBounce = (info: Collision) => {
    "worklet";

    const circleInfo = info.o1 as CircleInterface;

    circleInfo.y.value = circleInfo.y.value - circleInfo.r.value;

    console.log(info)
    // turn direction around 
    circleInfo.vx = circleInfo.vx;
    circleInfo.ax = circleInfo.ax;
    circleInfo.vy = -circleInfo.vy;
    circleInfo.ay = -circleInfo.ay;
};

const resolveCollisionWithExplosion = (info: Collision, explosionObject: ExplosionInterface) => {
    "worklet";

    const brickInfo = info.o2 as BrickInterface;
    explosionObject.opacity.value = 1
    explosionObject.x.value = brickInfo.x.value;
    explosionObject.y.value = brickInfo.y.value;
    // explosionPositionX.value = 250;

    brickInfo.canCollide.value = false;
    brickInfo.x.value = -1000;
};

// circle paddle collision
export const resolveCirclePaddleCollision = (circle: CircleInterface, paddle: PaddleInterface) => {
    "worklet";
    if(
        circle.x.value + circle.r.value > paddle.x.value &&
        circle.x.value - circle.r.value < paddle.x.value + paddle.width &&
        circle.y.value + circle.r.value > paddle.y.value &&
        circle.y.value - circle.r.value < paddle.y.value + paddle.height
    ){
        circle.y.value = paddle.y.value - circle.r.value;
        circle.vy *= -1;
        circle.ay *= -1;
    }
}

const move = (object: CircleInterface, dt: number) => {
    "worklet";
    
    object.vx += object.ax * dt;
    object.vy += object.ay * dt;

    object.vx = Math.min(object.vx, MAX_SPEED);
    object.vy = Math.min(object.vy, MAX_SPEED);

    object.vx = Math.max(object.vx, -MAX_SPEED);
    object.vy = Math.max(object.vy, -MAX_SPEED);
    object.x.value += object.vx * dt;
    object.y.value += object.vy * dt;
}

export const animate = (
    objects: ShapeInterface[],
    timeSincePreviousFrame: number,
    brickCount: number,
    explosionObject: ExplosionInterface
) => {
    "worklet";
    for(const o of objects){
        if(o.type === "Circle"){
            const typedObject = o as CircleInterface;
            move(typedObject as CircleInterface, (0.15 / 16) * timeSincePreviousFrame);
            resolveWallCollision(typedObject, width, height);
            // resolveCirclePaddleCollision(typedObject, objects[1] as PaddleInterface);
        }
    }

    const collisions : Collision[] = []; 
    
    // checkCollision(objects[0], objects[1]);
    for(const [i, o1] of objects.entries()){
        for(const [j, o2] of objects.entries()){
            if(i < j){
                const {collided, collisionInfo} = checkCollision(o1, o2);
                if(collided && collisionInfo){
                    collisions.push(collisionInfo);
                }
            }
        }
    }
    for (const collision of collisions) {
        console.log(collision);
        // explosionPositionX.value = 100;
        if(collision.o1.type === "Brick" || collision.o2.type === "Brick") resolveCollisionWithExplosion(collision, explosionObject);
        resolveCollisionWithBounce(collision);
    }
    
}