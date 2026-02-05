import React from 'react';
import { useGameStore } from '../store';
import { GameState } from '../types';

const Menu: React.FC = () => {
  const setGameState = useGameStore(state => state.setGameState);
  const resetGame = useGameStore(state => state.resetGame);
  
  const startGame = () => {
    resetGame();
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 text-white">
      <h1 className="text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        URBAN VOID
      </h1>
      <p className="text-xl mb-8 text-gray-300">Consume the city. Grow larger. Devour opponents.</p>
      <button 
        onClick={startGame}
        className="px-8 py-4 bg-white text-black font-bold text-2xl rounded-full hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)]"
      >
        PLAY NOW
      </button>
      <div className="mt-8 text-sm text-gray-500">
        <p>Controls: Mouse to Move</p>
        <p>Rules: Eat small things first. Run from bigger holes.</p>
      </div>
    </div>
  );
};

const GameOver: React.FC = () => {
  // Select leaderboard only once at end
  const getLeaderboard = useGameStore(state => state.getLeaderboard);
  const setGameState = useGameStore(state => state.setGameState);
  const leaderboard = getLeaderboard();
  const winner = leaderboard[0] || { id: 'none', name: 'None', color: '#fff', score: 0 };
  const isPlayerWinner = winner.id === 'player-1';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 text-white">
      <h2 className="text-5xl font-bold mb-4">
        {isPlayerWinner ? 'VICTORY!' : 'DEFEATED'}
      </h2>
      <p className="text-2xl mb-8">Winner: <span style={{color: winner.color}}>{winner.name}</span></p>
      
      <div className="bg-gray-800 p-6 rounded-xl w-80 mb-8">
        <h3 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">Final Scores</h3>
        {leaderboard.map((entry, i) => (
           <div key={entry.id} className="flex justify-between py-2 items-center">
             <div className="flex items-center gap-2">
               <span className="font-mono text-gray-400">#{i+1}</span>
               <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
               <span className={entry.id === 'player-1' ? 'font-bold text-white' : 'text-gray-300'}>{entry.name}</span>
             </div>
             <span className="font-mono text-yellow-400">{entry.score} pts</span>
           </div>
        ))}
      </div>

      <button 
        onClick={() => setGameState(GameState.MENU)}
        className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition-colors"
      >
        MAIN MENU
      </button>
    </div>
  );
};

const HUD: React.FC = () => {
  const timeLeft = useGameStore(state => state.timeLeft);
  
  // Custom selector to derive leaderboard data
  const leaderboard = useGameStore(state => {
     const holes = Object.values(state.holes);
     return holes
       .sort((a, b) => b.score - a.score)
       .map(h => ({ id: h.id, name: h.name, score: Math.floor(h.score), color: h.color }));
  });
  
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-4">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="text-4xl font-black text-white drop-shadow-md font-mono">
          {timeString}
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-black/50 p-4 rounded-lg backdrop-blur-sm min-w-[200px]">
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 opacity-70">Leaderboard</h3>
        <div className="flex flex-col gap-1">
          {leaderboard.map((entry, i) => (
            <div key={entry.id} className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2">
                 <span className="text-gray-400 w-4">{i+1}.</span>
                 <span className="text-white truncate max-w-[100px]" style={{color: entry.id === 'player-1' ? '#ff0088' : 'white'}}>
                    {entry.name}
                 </span>
               </div>
               <span className="text-yellow-400 font-mono">{entry.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const UI: React.FC = () => {
  const gameState = useGameStore(state => state.gameState);

  return (
    <>
      {gameState === GameState.MENU && <Menu />}
      {gameState === GameState.GAME_OVER && <GameOver />}
      {gameState === GameState.PLAYING && <HUD />}
    </>
  );
};