
import React, { useRef, useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ScoreboardMenu } from "@/components/ScoreboardMenu";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { getScoreboardSettings } from "@/lib/supabase";

export default function ScoreboardPage() {
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [teamAColor, setTeamAColor] = useState("#8B5CF6"); // Default purple
  const [teamBColor, setTeamBColor] = useState("#10B981"); // Default green

  useEffect(() => {
    // Get fullscreen state
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Get scoreboard settings
    const getSettings = async () => {
      const settings = await getScoreboardSettings();
      if (settings) {
        setTeamAColor(settings.team_a_color);
        setTeamBColor(settings.team_b_color);
      }
    };
    
    getSettings();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
  
  const resetScore = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAScore(0);
    } else {
      setTeamBScore(0);
    }
  };

  return (
    <>
      {/* Site Header (visible only when not in fullscreen) */}
      {!isFullscreen && <Header />}
      
      {/* Menu de controles (visível apenas quando não estiver em fullscreen ou quando showControls for true) */}
      {showControls && !isFullscreen && (
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
        className={`${showControls && !isFullscreen ? 'mt-8 bg-volleyball-purple/5 p-8 rounded-lg w-full' : 'fixed inset-0 z-40 flex items-center justify-center'}`}
      >
        <div className={`w-full h-full max-w-full mx-auto ${!showControls || isFullscreen ? 'p-0' : ''}`}>
          <div className={`flex flex-col md:flex-row justify-between ${
            isFullscreen ? 'h-full' : 'gap-8'
          }`}>
            {/* Time A */}
            <div className={`flex-1 ${
              isFullscreen 
                ? 'h-full flex flex-col justify-center' 
                : 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center relative'
            }`}
            style={{
              background: isFullscreen ? `linear-gradient(to bottom right, ${teamAColor}, black)` : ''
            }}>
              <h2 className={`${
                isFullscreen 
                  ? 'text-4xl md:text-6xl font-bold mb-6 text-white text-center' 
                  : 'text-2xl md:text-4xl font-bold mb-6'
              }`}>TIME A</h2>
              <div className={`${
                isFullscreen 
                  ? 'text-9xl md:text-[12rem] xl:text-[15rem] font-bold text-white text-center' 
                  : 'text-6xl md:text-8xl xl:text-9xl font-bold text-volleyball-purple'
              }`}>
                {teamAScore}
              </div>
              
              {/* Botões para incrementar/decrementar (visíveis sempre) */}
              <div className="flex justify-center mt-6 gap-4">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => decrementScore('A')}
                  className={`rounded-full ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white' : ''}`}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={() => incrementScore('A')}
                  className={`rounded-full ${isFullscreen ? 'bg-white hover:bg-white/80 text-volleyball-purple' : 'bg-volleyball-purple hover:bg-volleyball-purple/80'}`}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => resetScore('A')}
                  className={`rounded-full ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white' : ''}`}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Informações do Set (visível apenas quando não estiver em fullscreen) */}
            {!isFullscreen && (
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
            <div className={`flex-1 ${
              isFullscreen 
                ? 'h-full flex flex-col justify-center' 
                : 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center relative'
            }`}
            style={{
              background: isFullscreen ? `linear-gradient(to bottom left, ${teamBColor}, black)` : ''
            }}>
              <h2 className={`${
                isFullscreen 
                  ? 'text-4xl md:text-6xl font-bold mb-6 text-white text-center' 
                  : 'text-2xl md:text-4xl font-bold mb-6'
              }`}>TIME B</h2>
              <div className={`${
                isFullscreen 
                  ? 'text-9xl md:text-[12rem] xl:text-[15rem] font-bold text-white text-center' 
                  : 'text-6xl md:text-8xl xl:text-9xl font-bold text-volleyball-green'
              }`}>
                {teamBScore}
              </div>
              
              {/* Botões para incrementar/decrementar (visíveis sempre) */}
              <div className="flex justify-center mt-6 gap-4">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => decrementScore('B')}
                  className={`rounded-full ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white' : ''}`}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={() => incrementScore('B')}
                  className={`rounded-full ${isFullscreen ? 'bg-white hover:bg-white/80 text-volleyball-green' : 'bg-volleyball-green hover:bg-volleyball-green/80'}`}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => resetScore('B')}
                  className={`rounded-full ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white' : ''}`}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu flutuante apenas com botão de fullscreen */}
      <ScoreboardMenu 
        scoreboardRef={scoreboardRef}
      />
    </>
  );
}
