
import { useState, useEffect, useRef } from "react";
import { PageContainer } from "@/components/PageContainer";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FullscreenButton } from "@/components/FullscreenButton";
import { getScoreboardSettings, updateScoreboardSettings } from "@/lib/supabase";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Menu, X, ChevronUp, ChevronDown } from "lucide-react";

export default function ScoreboardPage() {
  // States for scoreboard
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [activeTab, setActiveTab] = useState("scoreboard");
  const scoreboardRef = useRef<HTMLDivElement>(null);
  
  // States for settings
  const [teamAColor, setTeamAColor] = useState("#8B5CF6"); // Default: Violet
  const [teamBColor, setTeamBColor] = useState("#10B981"); // Default: Emerald
  const [teamAFontColor, setTeamAFontColor] = useState("#FFFFFF"); // Default: White
  const [teamBFontColor, setTeamBFontColor] = useState("#FFFFFF"); // Default: White
  const [teamAName, setTeamAName] = useState("Time A");
  const [teamBName, setTeamBName] = useState("Time B");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  // Tabs
  const tabs = [
    { id: "scoreboard", label: "Placar" },
    { id: "configure", label: "Configurar Placar" },
  ];
  
  // Load scoreboard settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await getScoreboardSettings();
        
        if (settings) {
          setTeamAColor(settings.team_a_color || "#8B5CF6");
          setTeamBColor(settings.team_b_color || "#10B981");
          setTeamAFontColor(settings.team_a_font_color || "#FFFFFF");
          setTeamBFontColor(settings.team_b_font_color || "#FFFFFF");
          setTeamAName(settings.team_a_name || "Time A");
          setTeamBName(settings.team_b_name || "Time B");
        }
      } catch (error) {
        console.error("Error loading scoreboard settings:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações do placar",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);
  
  // Save scoreboard settings
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await updateScoreboardSettings({
        team_a_color: teamAColor,
        team_b_color: teamBColor,
        team_a_font_color: teamAFontColor,
        team_b_font_color: teamBFontColor,
        team_a_name: teamAName,
        team_b_name: teamBName
      });
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do placar foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Error saving scoreboard settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações do placar",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Increment score
  const incrementScore = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAScore(prev => prev + 1);
    } else {
      setTeamBScore(prev => prev + 1);
    }
  };
  
  // Decrement score
  const decrementScore = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAScore(prev => prev > 0 ? prev - 1 : 0);
    } else {
      setTeamBScore(prev => prev > 0 ? prev - 1 : 0);
    }
  };
  
  // Reset score
  const resetScore = () => {
    setTeamAScore(0);
    setTeamBScore(0);
    toast({
      title: "Placar resetado",
      description: "O placar foi resetado para 0x0",
    });
  };
  
  // Handle touch events for score adjustments
  useEffect(() => {
    if (!scoreboardRef.current) return;
    
    const scoreboardElement = scoreboardRef.current;
    let touchStartY = 0;
    let touchTeam: 'A' | 'B' | null = null;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const scoreboardRect = scoreboardElement.getBoundingClientRect();
      const midpoint = scoreboardRect.left + scoreboardRect.width / 2;
      
      touchTeam = touchX < midpoint ? 'A' : 'B';
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const scoreboardRect = scoreboardElement.getBoundingClientRect();
      const midpoint = scoreboardRect.left + scoreboardRect.width / 2;
      const team = touchEndX < midpoint ? 'A' : 'B';
      
      // Detect swipe
      const yDiff = touchStartY - touchEndY;
      
      // If it's a very small movement, treat it as a tap/click
      if (Math.abs(yDiff) < 10) {
        incrementScore(team);
        return;
      }
      
      // Handle swipe gesture
      if (touchTeam === team) {
        if (yDiff > 50) {
          // Swiped up
          incrementScore(team);
        } else if (yDiff < -50) {
          // Swiped down
          decrementScore(team);
        }
      }
    };
    
    // Handle click events for score adjustments
    const handleClick = (e: MouseEvent) => {
      if (document.fullscreenElement) {
        const clickX = e.clientX;
        const scoreboardRect = scoreboardElement.getBoundingClientRect();
        const midpoint = scoreboardRect.left + scoreboardRect.width / 2;
        const team = clickX < midpoint ? 'A' : 'B';
        
        incrementScore(team);
      }
    };
    
    scoreboardElement.addEventListener('touchstart', handleTouchStart);
    scoreboardElement.addEventListener('touchend', handleTouchEnd);
    scoreboardElement.addEventListener('click', handleClick);
    
    return () => {
      scoreboardElement.removeEventListener('touchstart', handleTouchStart);
      scoreboardElement.removeEventListener('touchend', handleTouchEnd);
      scoreboardElement.removeEventListener('click', handleClick);
    };
  }, [scoreboardRef]);

  if (isLoading) {
    return (
      <PageContainer title="Placar">
        <div className="flex justify-center">Carregando placar...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Placar"
      description="Visualize e controle o placar do jogo."
    >
      <div className="mb-6">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>
      
      {activeTab === "scoreboard" && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-3xl">
            {/* Preview/Control Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Preview do Placar</h2>
              <div 
                className="scoreboard-preview border rounded overflow-hidden mb-4"
                style={{
                  aspectRatio: "16/9",
                  maxHeight: "320px"
                }}
              >
                <div 
                  ref={scoreboardRef}
                  className="w-full h-full flex"
                  style={{
                    touchAction: "none" // Prevent default touch actions
                  }}
                >
                  <div 
                    className="w-1/2 flex flex-col items-center justify-center"
                    style={{ backgroundColor: teamAColor }}
                  >
                    <h3 
                      className="text-3xl font-bold mb-2" 
                      style={{ color: teamAFontColor }}
                    >
                      {teamAName}
                    </h3>
                    <p 
                      className="text-6xl font-bold" 
                      style={{ color: teamAFontColor }}
                    >
                      {teamAScore}
                    </p>
                  </div>
                  <div 
                    className="w-1/2 flex flex-col items-center justify-center"
                    style={{ backgroundColor: teamBColor }}
                  >
                    <h3 
                      className="text-3xl font-bold mb-2" 
                      style={{ color: teamBFontColor }}
                    >
                      {teamBName}
                    </h3>
                    <p 
                      className="text-6xl font-bold" 
                      style={{ color: teamBFontColor }}
                    >
                      {teamBScore}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{teamAName}</span>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => decrementScore('A')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{teamAScore}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => incrementScore('A')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{teamBName}</span>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => decrementScore('B')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{teamBScore}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => incrementScore('B')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={resetScore}
                >
                  Resetar Placar
                </Button>
                
                <FullscreenButton 
                  targetRef={scoreboardRef} 
                  className="mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "configure" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Time A</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamAName">Nome do Time</Label>
                <Input 
                  id="teamAName"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Nome do Time A"
                />
              </div>
              
              <div>
                <Label>Cor de Fundo</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: teamAColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker
                        color={teamAColor}
                        onChange={setTeamAColor}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input 
                    value={teamAColor}
                    onChange={(e) => setTeamAColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div>
                <Label>Cor da Fonte</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: teamAFontColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker
                        color={teamAFontColor}
                        onChange={setTeamAFontColor}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input 
                    value={teamAFontColor}
                    onChange={(e) => setTeamAFontColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Time B</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamBName">Nome do Time</Label>
                <Input 
                  id="teamBName"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Nome do Time B"
                />
              </div>
              
              <div>
                <Label>Cor de Fundo</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: teamBColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker
                        color={teamBColor}
                        onChange={setTeamBColor}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input 
                    value={teamBColor}
                    onChange={(e) => setTeamBColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div>
                <Label>Cor da Fonte</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: teamBFontColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker
                        color={teamBFontColor}
                        onChange={setTeamBFontColor}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input 
                    value={teamBFontColor}
                    onChange={(e) => setTeamBFontColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 flex justify-center">
            <Button 
              onClick={saveSettings}
              disabled={isSaving}
              className="volleyball-button-primary"
            >
              {isSaving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
