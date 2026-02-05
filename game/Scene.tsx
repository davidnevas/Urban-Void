import React from 'react';
import { Ground } from './Ground';
import { Hole } from './Hole';
import { City } from './City';
import { useGameStore } from '../store';
import { GameState } from '../types';

export const Scene: React.FC = () => {
  const { gameState } = useGameStore();
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Background Color */}
      <color attach="background" args={['#202025']} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#202025', 50, 150]} />

      {/* Physics World Components */}
      <Ground />
      
      {gameState === GameState.PLAYING && (
        <>
          <City />
          
          {/* Player */}
          <Hole id="player-1" isPlayer color="#ff0088" name="YOU" initialPos={[0, 0.1, 0]} />
          
          {/* AI Bots */}
          <Hole id="ai-1" color="#0088ff" name="Bot Alpha" initialPos={[30, 0.1, 30]} />
          <Hole id="ai-2" color="#00ff88" name="Bot Beta" initialPos={[-30, 0.1, -30]} />
          <Hole id="ai-3" color="#ffaa00" name="Bot Gamma" initialPos={[30, 0.1, -30]} />
        </>
      )}
    </>
  );
};