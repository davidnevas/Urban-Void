/// <reference lib="dom" />
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { createGroundMaterial } from './materials';
import { HoleData } from '../types';

export const Ground: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const holes = useGameStore((state) => state.holes);

  // We actually generate a procedural grid texture to avoid loading external heavy assets
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Asphalt base
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid lines (streets)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 20;
    ctx.beginPath();
    
    // Draw grid
    for(let i=0; i<=512; i+=128) {
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
    }
    ctx.stroke();
    
    // Road markings
    ctx.setLineDash([20, 20]);
    ctx.strokeStyle = '#FE4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=64; i<512; i+=128) {
       ctx.moveTo(i, 0); ctx.lineTo(i, 512);
       ctx.moveTo(0, i); ctx.lineTo(512, i);
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    return tex;
  }, []);

  const material = useMemo(() => createGroundMaterial(gridTexture), [gridTexture]);

  useFrame(() => {
    if (!meshRef.current || !meshRef.current.material) return;
    
    // Update shader uniforms
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (mat.userData.shader) {
      const holesArray = Object.values(holes) as HoleData[];
      const activeHoles = holesArray.slice(0, 4); // Max 4 holes supported by shader
      
      mat.userData.shader.uniforms.uHoleCount.value = activeHoles.length;
      
      activeHoles.forEach((hole, index) => {
        // Uniform format: x, radius (stored in y), z
        mat.userData.shader.uniforms.uHoles.value[index].set(
          hole.position[0],
          hole.radius,
          hole.position[2]
        );
      });
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.1, 0]} // Slightly below 0 to avoid Z-fighting if we had physics plane
      receiveShadow
    >
      <planeGeometry args={[200, 200, 100, 100]} />
      {/* We attach the custom material manually to ensure onBeforeCompile works */}
      <primitive object={material} attach="material" />
    </mesh>
  );
};