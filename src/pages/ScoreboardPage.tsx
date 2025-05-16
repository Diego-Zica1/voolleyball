
import React, { useRef, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ScoreboardMenu } from "@/components/ScoreboardMenu";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

export default function ScoreboardPage() {
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const incrementScore = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAScore(prev => prev + 1);
    } else {
      setTeamBScore(prev => prev + 1);
    }
  };

  const decrementScore = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAScore(prev => Math.max(0, prev - 1));
    } else {
      setTeamBScore(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <>
      {/* Menu de controles (visível apenas quando não estiver em fullscreen ou quando showControls for true) */}
      {showControls && (
        <PageContainer title="Placar">
          <div className="text-center">
            <p className="mt-4 text-muted-foreground">
              Configure o placar conforme necessário. Clique no botão de tela cheia para exibir somente o placar.
            </p>
          </div>
        </PageContainer>
      )}
      
      {/* Placar principal (referenciado para o modo tela cheia) */}
      <div 
        ref={scoreboardRef}
        className={`${showControls ? 'mt-8 bg-volleyball-purple/5 p-8 rounded-lg w-full' : 'fixed inset-0 z-40 bg-gradient-to-br from-black to-volleyball-purple-900 flex items-center justify-center'}`}
      >
        <div className={`w-full max-w-5xl mx-auto ${!showControls && 'p-8'}`}>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Time A */}
            <div className={`flex-1 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center relative ${!showControls && 'h-[80vh] flex flex-col justify-center'}`}>
              <h2 className="text-2xl md:text-4xl font-bold mb-6">TIME A</h2>
              <div className="text-6xl md:text-8xl xl:text-9xl font-bold text-volleyball-purple">
                {teamAScore}
              </div>
              
              {/* Botões para incrementar/decrementar (visíveis sempre) */}
              <div className="flex justify-center mt-6 gap-4">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => decrementScore('A')}
                  className="rounded-full"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={() => incrementScore('A')}
                  className="rounded-full bg-volleyball-purple hover:bg-volleyball-purple/80"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Botões de controle flutuantes (visíveis apenas no modo fullscreen) */}
              {!showControls && (
                <div className="absolute top-8 left-8 flex flex-col gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => decrementScore('A')}
                    className="rounded-full bg-black/30 hover:bg-black/50 text-white"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => incrementScore('A')}
                    className="rounded-full bg-black/30 hover:bg-black/50 text-white"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Informações do Set (visível apenas quando não estiver em fullscreen) */}
            {showControls && (
              <div className="flex flex-col justify-center items-center">
                <div className="text-xl md:text-3xl font-semibold mb-4 text-center">SET {currentSet}</div>
                <div className="flex gap-2 md:gap-4">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500"></div>
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-300"></div>
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-300"></div>
                </div>
              </div>
            )}
            
            {/* Time B */}
            <div className={`flex-1 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center relative ${!showControls && 'h-[80vh] flex flex-col justify-center'}`}>
              <h2 className="text-2xl md:text-4xl font-bold mb-6">TIME B</h2>
              <div className="text-6xl md:text-8xl xl:text-9xl font-bold text-volleyball-green">
                {teamBScore}
              </div>
              
              {/* Botões para incrementar/decrementar (visíveis sempre) */}
              <div className="flex justify-center mt-6 gap-4">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => decrementScore('B')}
                  className="rounded-full"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={() => incrementScore('B')}
                  className="rounded-full bg-volleyball-green hover:bg-volleyball-green/80"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Botões de controle flutuantes (visíveis apenas no modo fullscreen) */}
              {!showControls && (
                <div className="absolute top-8 right-8 flex flex-col gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => decrementScore('B')}
                    className="rounded-full bg-black/30 hover:bg-black/50 text-white"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => incrementScore('B')}
                    className="rounded-full bg-black/30 hover:bg-black/50 text-white"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu flutuante sempre visível */}
      <ScoreboardMenu 
        scoreboardRef={scoreboardRef}
        onToggleMenu={toggleControls}
      />
    </>
  );
}
