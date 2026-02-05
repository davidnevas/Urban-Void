import React, { useMemo } from 'react';
import { Ground } from './Ground';
import { Hole } from './Hole';
import { City } from './City';
import { useGameStore } from '../store';
import { GameState } from '../types';

export const Scene: React.FC = () => {
  // Fix: Select only gameState to prevent re-renders on hole updates
  const gameState = useGameStore(state => state.gameState);
  
  // Memoize positions to prevent useEffect triggers in Hole component
  const playerPos = useMemo<[number, number, number]>(() => [0, 0.1, 0], []);
  const bot1Pos = useMemo<[number, number, number]>(() => [30, 0.1, 30], []);
  const bot2Pos = useMemo<[number, number, number]>(() => [-30, 0.1, -30], []);
  const bot3Pos = useMemo<[number, number, number]>(() => [30, 0.1, -30], []);

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
          <Hole id="player-1" isPlayer color="#ff0088" name="YOU" initialPos={playerPos} />
          
          {/* AI Bots */}
          <Hole id="ai-1" color="#0088ff" name="Bot Alpha" initialPos={bot1Pos} />
          <Hole id="ai-2" color="#00ff88" name="Bot Beta" initialPos={bot2Pos} />
          <Hole id="ai-3" color="#ffaa00" name="Bot Gamma" initialPos={bot3Pos} />
        </>
      )}
    </>
  );
};