/// <reference lib="dom" />
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { physicsState } from './PhysicsState';
import { GameState } from '../types';

interface HoleProps {
  id: string;
  isPlayer?: boolean;
  initialPos?: [number, number, number];
  color: string;
  name: string;
}

const START_RADIUS = 1.5;
const MAX_SPEED = 12;

export const Hole: React.FC<HoleProps> = ({ id, isPlayer = false, initialPos = [0, 0, 0], color, name }) => {
  const position = useRef<THREE.Vector3>(new THREE.Vector3(...initialPos));
  const velocity = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const radius = useRef(START_RADIUS);
  const score = useRef(0);
  
  // Only subscribe to register function, not state
  const registerHole = useGameStore(state => state.registerHole);
  const updateHoleScore = useGameStore(state => state.updateHole); // Renamed usage conceptually
  
  const { camera, raycaster, pointer } = useThree();
  const visualRef = useRef<THREE.Group>(null);

  // Initial Registration
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
    
    // Initialize physics state
    physicsState.updateEntity(id, new THREE.Vector3(...initialPos), START_RADIUS, isPlayer);

    return () => {
      physicsState.removeEntity(id);
    };
  }, [id, registerHole, initialPos, isPlayer, name, color]);

  // AI State
  const aiTarget = useRef<THREE.Vector3 | null>(null);
  const aiChangeTimer = useRef(0);

  useFrame((state, delta) => {
    if (useGameStore.getState().gameState !== GameState.PLAYING) return;

    const currentPos = position.current;
    let targetVelocity = new THREE.Vector3(0, 0, 0);

    // --- MOVEMENT LOGIC ---
    if (isPlayer) {
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      
      if (target) {
        const direction = target.clone().sub(currentPos);
        const dist = direction.length();
        if (dist > 0.5) {
             direction.normalize().multiplyScalar(MAX_SPEED);
             targetVelocity.copy(direction);
        }
      }
    } else {
      // --- AI LOGIC ---
      aiChangeTimer.current -= delta;
      if (aiChangeTimer.current <= 0) {
         aiChangeTimer.current = Math.random() * 2 + 1;
         
         let nearestThreat = null;
         let minThreatDist = 10;
         
         // Use Physics State for AI perception (Fast, no React overhead)
         const allEntities = physicsState.getEntities();
         
         allEntities.forEach(ent => {
            if (ent.id === id) return;
            const dist = ent.position.distanceTo(currentPos);
            if (dist < minThreatDist && ent.radius > radius.current) {
                nearestThreat = ent;
                minThreatDist = dist;
            }
         });

         if (nearestThreat) {
             // Flee
             const threatPos = (nearestThreat as any).position;
             aiTarget.current = currentPos.clone().sub(threatPos).normalize().multiplyScalar(20).add(currentPos);
         } else {
             // Wander
             const randomAngle = Math.random() * Math.PI * 2;
             const range = 40;
             aiTarget.current = new THREE.Vector3(Math.cos(randomAngle) * range, 0, Math.sin(randomAngle) * range);
         }
      }

      if (aiTarget.current) {
          const dir = aiTarget.current.clone().sub(currentPos);
          if (dir.length() > 0.5) {
              dir.normalize().multiplyScalar(MAX_SPEED * 0.85); 
              targetVelocity.copy(dir);
          }
      }
    }

    // Physics Update
    velocity.current.lerp(targetVelocity, delta * 3);
    
    // World Bounds
    const boundary = 95;
    if (currentPos.x > boundary) velocity.current.x = -Math.abs(velocity.current.x);
    if (currentPos.x < -boundary) velocity.current.x = Math.abs(velocity.current.x);
    if (currentPos.z > boundary) velocity.current.z = -Math.abs(velocity.current.z);
    if (currentPos.z < -boundary) velocity.current.z = Math.abs(velocity.current.z);

    currentPos.add(velocity.current.clone().multiplyScalar(delta));

    // Update Visuals
    if (visualRef.current) {
      visualRef.current.position.copy(currentPos);
      visualRef.current.scale.set(radius.current, 1, radius.current);
    }
    
    // Sync to Physics State (Fast)
    physicsState.updateEntity(id, currentPos, radius.current, isPlayer);

    // Sync Camera (Player only)
    if (isPlayer) {
      const targetCamPos = new THREE.Vector3(currentPos.x, 30 + (radius.current * 2), currentPos.z + 20 + radius.current);
      camera.position.lerp(targetCamPos, delta * 2);
      camera.lookAt(currentPos.x, 0, currentPos.z);
    }
  });

  // Event listener for growth (Logic)
  useEffect(() => {
    const onEat = (e: CustomEvent) => {
      if (e.detail.holeId === id) {
        const val = e.detail.value;
        const size = e.detail.size;
        score.current += val * 10;
        radius.current = Math.sqrt(Math.pow(radius.current, 2) + (size * size * 0.5));
        
        // Update Store Score (Low Frequency - Only on event)
        updateHoleScore(id, { 
            score: score.current,
            radius: radius.current 
        });
      }
    };
    window.addEventListener('hole-eat', onEat as any);
    return () => window.removeEventListener('hole-eat', onEat as any);
  }, [id, updateHoleScore]);

  return (
    <group ref={visualRef}>
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[1, 1, 10, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.95, 1.05, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {isPlayer && (
        <mesh position={[0, 1, 0]}>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}
    </group>
  );
};