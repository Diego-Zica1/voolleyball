
import React, { useRef, useState, useEffect, TouchEvent } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ScoreboardMenu } from "@/components/ScoreboardMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Minus, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { getScoreboardSettings, updateScoreboardSettings } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ScoreboardSettings } from "@/types";

export default function ScoreboardPage() {
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [teamAColor, setTeamAColor] = useState("#8B5CF6"); // Default purple
  const [teamBColor, setTeamBColor] = useState("#10B981"); // Default green
  const [teamAName, setTeamAName] = useState("TIME A");
  const [teamBName, setTeamBName] = useState("TIME B");
  const [teamAFontColor, setTeamAFontColor] = useState("#FFFFFF");
  const [teamBFontColor, setTeamBFontColor] = useState("#FFFFFF");
  const [isSaving, setIsSaving] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchTeam, setTouchTeam] = useState<'A' | 'B' | null>(null);
  
  const { toast } = useToast();

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
        
        if (settings.team_a_name) setTeamAName(settings.team_a_name);
        if (settings.team_b_name) setTeamBName(settings.team_b_name);
        if (settings.team_a_font_color) setTeamAFontColor(settings.team_a_font_color);
        if (settings.team_b_font_color) setTeamBFontColor(settings.team_b_font_color);
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

  // Touch gesture handlers for fullscreen mode

  const handleScoreClick = (team: 'A' | 'B') => {
    if (isFullscreen && !setWasSwipe) {
      incrementScore(team);
    }
  };

  const handleTouchStart = (team: 'A' | 'B', e: TouchEvent<HTMLDivElement>) => {
    if (isFullscreen) {
      setTouchTeam(team);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (isFullscreen && touchStartY !== null && touchTeam) {
      const endY = e.changedTouches[0].clientY;
      const diffY = touchStartY - endY;

      if (diffY > 50) {
        incrementScore(touchTeam);
        setWasSwipe(true);
      } else if (diffY < -50) {
        decrementScore(touchTeam);
        setWasSwipe(true);
      }
    }
    setTouchStartY(null);
    setTouchTeam(null);
    setTimeout(() => setWasSwipe(false), 100); // reseta após 100ms
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (isFullscreen && touchStartY !== null && touchTeam && !setSwipeLocked) {
      const currentY = e.touches[0].clientY;
      const diffY = touchStartY - currentY;

      if (diffY > 50) {
        incrementScore(touchTeam);
        setTouchStartY(currentY);
        setSwipeLocked(true);
        setTimeout(() => setSwipeLocked(false), 300); // 300ms de bloqueio
      } else if (diffY < -50) {
        decrementScore(touchTeam);
        setTouchStartY(currentY);
        setSwipeLocked(true);
        setTimeout(() => setSwipeLocked(false), 300);
      }
    }
  };
  
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      const settings: Partial<ScoreboardSettings> = {
        team_a_color: teamAColor,
        team_b_color: teamBColor,
        team_a_name: teamAName,
        team_b_name: teamBName,
        team_a_font_color: teamAFontColor,
        team_b_font_color: teamBFontColor
      };
      
      const success = await updateScoreboardSettings(settings);
      
      if (success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações do placar foram salvas com sucesso",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render a preview of fullscreen scoreboard
  const renderScoreboardPreview = () => {
    return (
      <div className="w-full mt-8 border rounded-lg overflow-hidden shadow-lg">
        <h3 className="text-center py-2 bg-gray-100 dark:bg-gray-800 font-medium border-b">Preview do Placar</h3>
        <div className="flex flex-col md:flex-row">
          {/* Team A Preview */}
          <div 
            className="flex-1 p-4 flex flex-col items-center justify-center"
            style={{ backgroundColor: teamAColor }}
          >
            <h2 
              className="text-xl font-bold mb-2" 
              style={{ color: teamAFontColor }}
            >
              {teamAName}
            </h2>
            <div 
              className="text-5xl font-bold" 
              style={{ color: teamAFontColor }}
            >
              {teamAScore}
            </div>
          </div>
          
          {/* Team B Preview */}
          <div 
            className="flex-1 p-4 flex flex-col items-center justify-center"
            style={{ backgroundColor: teamBColor }}
          >
            <h2 
              className="text-xl font-bold mb-2" 
              style={{ color: teamBFontColor }}
            >
              {teamBName}
            </h2>
            <div 
              className="text-5xl font-bold" 
              style={{ color: teamBFontColor }}
            >
              {teamBScore}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Site Header (visible only when not in fullscreen) */}
      {!isFullscreen && <Header />}
      
      {/* Menu de controles (visível apenas quando não estiver em fullscreen ou quando showControls for true) */}
      {showControls && !isFullscreen && (
        <PageContainer title="Placar">
          <div className="text-center mb-6">
            <p className="mt-4 text-muted-foreground">
              Configure o placar conforme necessário. Clique no botão de tela cheia para exibir somente o placar.
            </p>
          </div>
          
          {/* Configurações do placar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Configurar Placar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configurações Time A */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Time A</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Time</label>
                  <Input
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    placeholder="TIME A"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor do Fundo</label>
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <div 
                            className="w-5 h-5 rounded-sm mr-2" 
                            style={{ backgroundColor: teamAColor }}
                          />
                          <span>{teamAColor}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HexColorPicker color={teamAColor} onChange={setTeamAColor} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor da Fonte</label>
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <div 
                            className="w-5 h-5 rounded-sm mr-2" 
                            style={{ backgroundColor: teamAFontColor }}
                          />
                          <span>{teamAFontColor}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HexColorPicker color={teamAFontColor} onChange={setTeamAFontColor} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              
              {/* Configurações Time B */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Time B</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Time</label>
                  <Input
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    placeholder="TIME B"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor do Fundo</label>
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <div 
                            className="w-5 h-5 rounded-sm mr-2" 
                            style={{ backgroundColor: teamBColor }}
                          />
                          <span>{teamBColor}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HexColorPicker color={teamBColor} onChange={setTeamBColor} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor da Fonte</label>
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <div 
                            className="w-5 h-5 rounded-sm mr-2" 
                            style={{ backgroundColor: teamBFontColor }}
                          />
                          <span>{teamBFontColor}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HexColorPicker color={teamBFontColor} onChange={setTeamBFontColor} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-right">
              <Button 
                onClick={saveSettings}
                disabled={isSaving}
                className="volleyball-button-primary"
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
            
            {/* Scoreboard Preview */}
            {renderScoreboardPreview()}
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
            <div 
              className={`flex-1 ${
                isFullscreen 
                  ? 'h-full flex flex-col justify-center' 
                  : 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center relative'
              }`}
              style={{
                background: isFullscreen ? teamAColor : ''
              }}
              onTouchStart={(e) => handleTouchStart('A', e)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onClick={() => handleScoreClick('A')}
            >
              <h2 className={`${
                isFullscreen 
                  ? 'text-4xl md:text-6xl font-bold mb-6 text-center' 
                  : 'text-2xl md:text-4xl font-bold mb-6'
              }`}
              style={{
                color: isFullscreen ? teamAFontColor : ''
              }}
              >
                {teamAName}
              </h2>
              <div 
                className={`${
                  isFullscreen 
                    ? 'text-9xl md:text-[12rem] xl:text-[15rem] font-bold text-center' 
                    : 'text-6xl md:text-8xl xl:text-9xl font-bold text-volleyball-purple'
                }`}
                style={{
                  color: isFullscreen ? teamAFontColor : ''
                }}
              >
                {teamAScore}
              </div>
              
              {/* Botões para incrementar/decrementar (visíveis sempre) */}
              <div className="flex justify-center mt-6 gap-4">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); decrementScore('A'); }}
                  className={`rounded-full ${isFullscreen ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); incrementScore('A'); }}
                  className={`rounded-full ${isFullscreen ? 'bg-white hover:bg-white/80 text-volleyball-purple' : 'bg-volleyball-purple hover:bg-volleyball-purple/80'}`}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); resetScore('A'); }}
                  className={`rounded-full ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white' : ''}`}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Time B */}
            <div 
              className={`flex-1 ${
                isFullscreen 
                  ? 'h-full flex flex-col justify-center' 
                  : 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center relative'
              }`}
              style={{
                background: isFullscreen ? teamBColor : ''
              }}
              onTouchStart={(e) => handleTouchStart('B', e)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onClick={() => handleScoreClick('B')}
            >
              <h2 className={`${
                isFullscreen 
                  ? 'text-4xl md:text-6xl font-bold mb-6 text-center' 
                  : 'text-2xl md:text-4xl font-bold mb-6'
              }`}
              style={{
                color: isFullscreen ? teamBFontColor : ''
              }}
              >
                {teamBName}
              </h2>
              <div 
                className={`${
                  isFullscreen 
                    ? 'text-9xl md:text-[12rem] xl:text-[15rem] font-bold text-center' 
                    : 'text-6xl md:text-8xl xl:text-9xl font-bold text-volleyball-green'
                }`}
                style={{
                  color: isFullscreen ? teamBFontColor : ''
                }}
              >
                {teamBScore}
              </div>
              
              {/* Botões para incrementar/decrementar (visíveis sempre) */}
              <div className="flex justify-center mt-6 gap-4">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); decrementScore('B'); }}
                  className={`rounded-full ${isFullscreen ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); incrementScore('B'); }}
                  className={`rounded-full ${isFullscreen ? 'bg-white hover:bg-white/80 text-volleyball-green' : 'bg-volleyball-green hover:bg-volleyball-green/80'}`}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); resetScore('B'); }}
                  className={`rounded-full ${isFullscreen ? 'bg-white/20 hover:bg-white/30 text-white' : ''}`}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu flutuante com botão de fullscreen */}
      <ScoreboardMenu 
        scoreboardRef={scoreboardRef}
      />
    </>
  );
}
function setSwipeLocked(arg0: boolean) {
  throw new Error("Function not implemented.");
}

function setWasSwipe(arg0: boolean) {
  throw new Error("Function not implemented.");
}

