
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Fullscreen, Minimize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FullscreenButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  className?: string;
}

export function FullscreenButton({ targetRef, className = '' }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const toggleFullscreen = async () => {
    if (!targetRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await targetRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível alternar para o modo de tela cheia",
        variant: "destructive",
      });
      console.error("Erro ao alternar tela cheia:", err);
    }
  };

  // Adicionar listener para detectar alterações no estado de tela cheia
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <Button 
      variant="ghost"
      size="icon"
      onClick={toggleFullscreen}
      className={`focus:outline-none ${className}`}
      aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
    >
      {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Fullscreen className="w-5 h-5" />}
    </Button>
  );
}
