import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { useGameStore } from './store';
import { GameState } from './types';
import { Scene } from './game/Scene';
import { UI } from './components/UI';

const App: React.FC = () => {
  const { gameState, decrementTime } = useGameStore();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === GameState.PLAYING) {
      timer = setInterval(() => {
        decrementTime();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, decrementTime]);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          camera={{ position: [0, 35, 20], fov: 40 }}
          dpr={[1, 2]} // Performance optimization
          gl={{ antialias: true, stencil: true, alpha: false }}
        >
          <Physics gravity={[0, -20, 0]} allowSleep={false}>
            <Scene />
          </Physics>
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <UI />
    </div>
  );
};

export default App;