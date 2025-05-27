
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
        className="bg-black hover:bg-black/80 text-white hover:text-withe/80 dark:bg-white dark:hover:bg-white/80 dark:text-black dark:hover:text-black/80 rounded-full shadow-lg w-16 h-16"
      />
    </div>
  );
}
