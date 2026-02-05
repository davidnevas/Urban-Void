/// <reference lib="dom" />
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { HoleData, GameState } from '../types';

interface HoleProps {
  id: string;
  isPlayer?: boolean;
  initialPos?: [number, number, number];
  color: string;
  name: string;
}

const START_RADIUS = 1.5;
const MAX_SPEED = 12;
const ACCELERATION = 40;

export const Hole: React.FC<HoleProps> = ({ id, isPlayer = false, initialPos = [0, 0, 0], color, name }) => {
  // We don't use physics body for the hole itself because it's a "void". 
  // It's a logic entity that moves on the XZ plane.
  const position = useRef<THREE.Vector3>(new THREE.Vector3(...initialPos));
  const velocity = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const radius = useRef(START_RADIUS);
  const score = useRef(0);
  
  const { registerHole, updateHole, gameState, holes } = useGameStore();
  const { camera, raycaster, pointer, scene } = useThree();

  // Visual ref for the "Void" interior (the black cylinder under the ground)
  const visualRef = useRef<THREE.Group>(null);

  useEffect(() => {
    registerHole({
      id,
      position: initialPos,
      radius: START_RADIUS,
      score: 0,
      isPlayer,
      name,
      color
    });
  }, [id, registerHole, initialPos, isPlayer, name, color]);

  // AI Target Logic
  const aiTarget = useRef<THREE.Vector3 | null>(null);
  const aiState = useRef<'SEEK' | 'FLEE' | 'WANDER'>('WANDER');
  const aiChangeTimer = useRef(0);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // --- MOVEMENT LOGIC ---
    const currentPos = position.current;
    let targetVelocity = new THREE.Vector3(0, 0, 0);

    if (isPlayer) {
      // Raycast to ground plane (y=0)
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      
      if (target) {
        const direction = target.clone().sub(currentPos);
        // Clamp length to max speed
        const dist = direction.length();
        if (dist > 0.5) { // Deadzone
             direction.normalize().multiplyScalar(MAX_SPEED);
             targetVelocity.copy(direction);
        }
      }
    } else {
      // --- AI LOGIC ---
      aiChangeTimer.current -= delta;
      
      if (aiChangeTimer.current <= 0) {
         aiChangeTimer.current = Math.random() * 2 + 1; // Change thought every 1-3s
         
         // 1. Check for larger holes to flee
         let nearestThreat: HoleData | null = null;
         let minThreatDist = 10;
         
         (Object.values(holes) as HoleData[]).forEach(h => {
            if (h.id === id) return;
            const dist = new THREE.Vector3(h.position[0], 0, h.position[2]).distanceTo(currentPos);
            if (dist < minThreatDist && h.radius > radius.current) {
                nearestThreat = h;
                minThreatDist = dist;
            }
         });

         if (nearestThreat) {
             aiState.current = 'FLEE';
             const threatHole = nearestThreat as HoleData;
             const threatPos = new THREE.Vector3(threatHole.position[0], 0, threatHole.position[2]);
             aiTarget.current = currentPos.clone().sub(threatPos).normalize().multiplyScalar(20).add(currentPos);
         } else {
             // 2. Seek props (Simulated via random points for now, or finding nearest prop in world)
             // For simplicity in this specialized component, AI wanders effectively.
             // Ideally we'd scan the `activeProps` from a store, but passing that around is expensive.
             // We'll simulate "Sensing" by just wandering towards center or random.
             aiState.current = 'WANDER';
             const randomAngle = Math.random() * Math.PI * 2;
             const range = 40;
             aiTarget.current = new THREE.Vector3(
                 Math.cos(randomAngle) * range,
                 0,
                 Math.sin(randomAngle) * range
             );
         }
      }

      if (aiTarget.current) {
          const dir = aiTarget.current.clone().sub(currentPos);
          if (dir.length() > 0.5) {
              dir.normalize().multiplyScalar(MAX_SPEED * 0.8); // AI slightly slower
              targetVelocity.copy(dir);
          }
      }
    }

    // Apply Velocity
    // Smooth dampening
    velocity.current.lerp(targetVelocity, delta * 3);
    
    // Bounds check
    const boundary = 95;
    if (currentPos.x > boundary) velocity.current.x = -Math.abs(velocity.current.x);
    if (currentPos.x < -boundary) velocity.current.x = Math.abs(velocity.current.x);
    if (currentPos.z > boundary) velocity.current.z = -Math.abs(velocity.current.z);
    if (currentPos.z < -boundary) velocity.current.z = Math.abs(velocity.current.z);

    currentPos.add(velocity.current.clone().multiplyScalar(delta));

    // Update Visuals
    if (visualRef.current) {
      visualRef.current.position.copy(currentPos);
      // The visual hole depth cylinder
      visualRef.current.scale.set(radius.current, 1, radius.current);
    }
    
    // Update Store (Throttled if needed, but per frame for shader is best)
    // We update the store every frame for the shader to work smoothly
    updateHole(id, { 
      position: [currentPos.x, currentPos.y, currentPos.z],
      radius: radius.current,
      score: score.current
    });

    // Camera Follow Player
    if (isPlayer) {
      const targetCamPos = new THREE.Vector3(currentPos.x, 30 + (radius.current * 2), currentPos.z + 20 + radius.current);
      camera.position.lerp(targetCamPos, delta * 2);
      camera.lookAt(currentPos.x, 0, currentPos.z);
    }
    
    // --- CONSUMPTION LOGIC handled in Props to avoid O(N^2) here, or check collision in Props ---
    // However, growing logic receives events. 
    // We expose a global listener or rely on Props checking distance.
    // Let's rely on Props pushing updates to us via a custom event or store method? 
    // No, Props are managed by Physics. 
    
    // Actually, for React Three, it's easier if the Prop checks against the list of Holes.
  });

  // Listen for "ate" events? 
  // We'll use a custom event system for "HoleAteObject" to avoid complex store wiring in tight loops.
  useEffect(() => {
    const onEat = (e: CustomEvent) => {
      if (e.detail.holeId === id) {
        const val = e.detail.value;
        const size = e.detail.size;
        
        // Growth formula:
        // Area += ObjectArea
        // pi * r^2 = pi * r_old^2 + val
        // r_new = sqrt(r_old^2 + val/pi)
        // Simplified: Linear or slightly exponential
        score.current += val * 10;
        radius.current = Math.sqrt(Math.pow(radius.current, 2) + (size * size * 0.5));
      }
    };
    window.addEventListener('hole-eat', onEat as any);
    return () => window.removeEventListener('hole-eat', onEat as any);
  }, [id]);

  return (
    <group ref={visualRef}>
      {/* The "Void" Interior - a black cylinder sinking into the ground */}
      {/* Since the ground shader discards pixels, we see this object UNDERNEATH */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[1, 1, 10, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Decorative Ring */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.95, 1.05, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Arrow/Indicator for Player */}
      {isPlayer && (
        <mesh position={[0, 1, 0]}>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}
    </group>
  );
};