
import React from 'react';
import { FullscreenButton } from './FullscreenButton';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';

interface ScoreboardMenuProps {
  scoreboardRef: React.RefObject<HTMLElement>;
  onToggleMenu?: () => void;
}

export function ScoreboardMenu({ scoreboardRef, onToggleMenu }: ScoreboardMenuProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 flex gap-2">
      {onToggleMenu && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onToggleMenu}
          className="bg-black/30 hover:bg-black/50 text-white rounded-full"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}
      <FullscreenButton 
        targetRef={scoreboardRef} 
        className="bg-black/30 hover:bg-black/50 text-white rounded-full"
      />
    </div>
  );
}
