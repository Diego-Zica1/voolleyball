
import React from 'react';
import { FullscreenButton } from './FullscreenButton';

interface ScoreboardMenuProps {
  scoreboardRef: React.RefObject<HTMLElement>;
}

export function ScoreboardMenu({ scoreboardRef }: ScoreboardMenuProps) {
  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center">
      <FullscreenButton 
        targetRef={scoreboardRef} 
        className="bg-black/30 hover:bg-black/50 text-white rounded-full shadow-lg w-16 h-16"
      />
    </div>
  );
}
