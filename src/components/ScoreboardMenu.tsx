
import React from 'react';
import { FullscreenButton } from './FullscreenButton';

interface ScoreboardMenuProps {
  scoreboardRef: React.RefObject<HTMLElement>;
}

export function ScoreboardMenu({ scoreboardRef }: ScoreboardMenuProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4">
      <FullscreenButton 
        targetRef={scoreboardRef} 
        className="bg-black/30 hover:bg-black/50 text-white rounded-full"
      />
    </div>
  );
}
