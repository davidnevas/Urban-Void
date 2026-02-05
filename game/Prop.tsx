/// <reference lib="dom" />
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox, useCylinder } from '@react-three/cannon';
import { useGameStore } from '../store';
import { PropConfig, PropType, HoleData } from '../types';
import * as THREE from 'three';

// Temporary vector for math
const vec = new THREE.Vector3();

export const Prop: React.FC<PropConfig> = ({ id, type, position, size, value, color }) => {
  const [consumed, setConsumed] = useState(false);
  
  // Physics Body
  // We use different shapes based on type
  const isCylinder = type === PropType.TREE || type === PropType.BARREL || type === PropType.LAMP;
  
  const [ref, api] = isCylinder 
    ? useCylinder(() => ({ mass: 1, position, args: [size, size, size * 2, 8] })) 
    : useBox(() => ({ mass: 1, position, args: [size * 2, size * 2, size * 2] }));

  const holes = useGameStore(state => state.holes);

  useFrame(() => {
    if (consumed) return; // Already falling or gone

    // Get current position from physics API
    // Note: accessing api.position.subscribe is slow if done every frame for 100s of objects.
    // Recommended: Use the ref.current which matches the mesh, but cannon updates it.
    if (!ref.current) return;
    
    const pos = ref.current.position;
    
    // Check against all holes
    const holeList = Object.values(holes) as HoleData[];
    for (const hole of holeList) {
      const dx = pos.x - hole.position[0];
      const dz = pos.z - hole.position[2];
      const dist = Math.sqrt(dx*dx + dz*dz); // Simple 2D distance

      // Consumption condition
      // 1. Center is within hole radius (or close enough)
      // 2. Hole is strictly larger than the object
      if (dist < hole.radius - (size * 0.5) && hole.radius > size * 1.2) {
        
        setConsumed(true);
        
        // 1. Disable collisions so it falls through the floor
        api.collisionFilterGroup.set(0);
        api.collisionFilterMask.set(0);
        
        // 2. Apply downward velocity
        api.velocity.set(0, -10, 0);
        
        // 3. Emit event for score/growth
        const event = new CustomEvent('hole-eat', { 
            detail: { holeId: hole.id, value, size } 
        });
        window.dispatchEvent(event);
        
        // 4. Cleanup after animation
        setTimeout(() => {
           // In a real optimized game, we'd recycle this object pool.
           // Here we just unmount via parent logic or hide.
           // Since we can't easily unmount from inside, we'll just stop rendering logic.
           if (ref.current) ref.current.visible = false;
        }, 1000);
        
        break; // Consumed by one hole only
      } else if (dist < hole.radius + size && hole.radius > size) {
        // Pull force (Gravity well effect) if near edge
        const force = 10;
        const angle = Math.atan2(dz, dx);
        // Pull towards center
        api.applyForce([-Math.cos(angle) * force, 0, -Math.sin(angle) * force], [0,0,0]);
      }
    }
  });

  if (!consumed && ref.current && ref.current.visible === false) return null;

  // Render Logic
  // Simple geometries for prototype "Realistic" assets
  return (
    <group ref={ref as any}>
       {type === PropType.TREE ? (
          <group position={[0, -size, 0]}>
             <mesh position={[0, size, 0]} castShadow>
               <coneGeometry args={[size * 1.5, size * 3, 8]} />
               <meshStandardMaterial color={color} flatShading />
             </mesh>
             <mesh position={[0, size * 0.2, 0]}>
               <cylinderGeometry args={[size * 0.3, size * 0.3, size, 6]} />
               <meshStandardMaterial color="#5d4037" />
             </mesh>
          </group>
       ) : type === PropType.BUILDING ? (
          <mesh castShadow receiveShadow>
             <boxGeometry args={[size * 2, size * 4, size * 2]} />
             <meshStandardMaterial color={color} roughness={0.2} metalness={0.5} />
             {/* Windows simulation via texture would go here */}
          </mesh>
       ) : type === PropType.CAR ? (
          <group>
             <mesh position={[0, size*0.5, 0]} castShadow>
               <boxGeometry args={[size * 1.8, size, size * 3.5]} />
               <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
             </mesh>
             <mesh position={[0, size*0.9, 0]}>
               <boxGeometry args={[size * 1.6, size*0.8, size * 2]} />
               <meshStandardMaterial color="#111" />
             </mesh>
          </group>
       ) : (
          <mesh castShadow>
             <boxGeometry args={[size * 2, size * 2, size * 2]} />
             <meshStandardMaterial color={color} />
          </mesh>
       )}
    </group>
  );
};