/// <reference lib="dom" />
import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox, useCylinder } from '@react-three/cannon';
import { physicsState } from './PhysicsState';
import { PropConfig, PropType } from '../types';

export const Prop: React.FC<PropConfig> = ({ id, type, position, size, value, color }) => {
  const [consumed, setConsumed] = useState(false);
  
  const isCylinder = type === PropType.TREE || type === PropType.BARREL || type === PropType.LAMP;
  
  const [ref, api] = isCylinder 
    ? useCylinder(() => ({ mass: 1, position, args: [size, size, size * 2, 8] })) 
    : useBox(() => ({ mass: 1, position, args: [size * 2, size * 2, size * 2] }));

  useFrame(() => {
    if (consumed) return;
    if (!ref.current) return;
    
    const pos = ref.current.position;
    
    // Transient read: Get holes directly from PhysicsState
    const holes = physicsState.getEntities();

    for (const hole of holes) {
      const dx = pos.x - hole.position.x;
      const dz = pos.z - hole.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz); 

      // Collision Logic
      if (dist < hole.radius - (size * 0.5) && hole.radius > size * 1.2) {
        setConsumed(true);
        // Disable physics
        api.collisionFilterGroup.set(0);
        api.collisionFilterMask.set(0);
        // Fall animation
        api.velocity.set(0, -10, 0);
        
        // Dispatch Event
        const event = new CustomEvent('hole-eat', { 
            detail: { holeId: hole.id, value, size } 
        });
        window.dispatchEvent(event);
        
        // Hide later
        setTimeout(() => {
           if (ref.current) ref.current.visible = false;
        }, 1000);
        break; 
      } else if (dist < hole.radius + size && hole.radius > size) {
        // Push away from edge if not fully inside
        const force = 10;
        const angle = Math.atan2(dz, dx);
        api.applyForce([-Math.cos(angle) * force, 0, -Math.sin(angle) * force], [0,0,0]);
      }
    }
  });

  if (!consumed && ref.current && ref.current.visible === false) return null;

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