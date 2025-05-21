
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllPlayers, getLatestGame, getConfirmations } from "@/lib/supabase";
import { Player, Team, Confirmation } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface TeamOption {
  name: string;
  playersCount: number;
}

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState("generate");
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
  const [absentPlayers, setAbsentPlayers] = useState<Player[]>([]);
  const [unconfirmedPlayers, setUnconfirmedPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
  const [selectedTeamOption, setSelectedTeamOption] = useState<string>("2teams-3vs3");
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [allConfirmations, setAllConfirmations] = useState<Confirmation[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const teamOptions: Record<string, TeamOption> = {
    "2teams-3vs3": {
      name: "2 Times (3x3)",
      playersCount: 6
    },
    "2teams-4vs4": {
      name: "2 Times (4x4)",
      playersCount: 8
    },
    "2teams-5vs5": {
      name: "2 Times (5x5)",
      playersCount: 10
    },
    "2teams-6vs6": {
      name: "2 Times (6x6)",
      playersCount: 12
    },
    "3teams-3vs3": {
      name: "3 Times (3x3)",
      playersCount: 9
    },
    "3teams-4vs4": {
      name: "3 Times (4x4)",
      playersCount: 12
    },
    "4teams-3vs3": {
      name: "4 Times (3x3)",
      playersCount: 12
    }
  };

  const tabs = [
    { id: "generate", label: "Gerar Times" },
    { id: "result", label: "Resultado" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // First, get all players and all confirmations
        const fetchedPlayers = await getAllPlayers();
        setAllPlayers(fetchedPlayers);
        
        const latestGame = await getLatestGame();
        
        if (!latestGame) {
          toast({
            title: "Nenhum jogo encontrado",
            description: "Não há jogos agendados no momento",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        const fetchedConfirmations = await getConfirmations(latestGame.id);
        setAllConfirmations(fetchedConfirmations);
        
        // Filter confirmed players
        const confirmedPlayerIds = fetchedConfirmations.map(c => c.user_id);
        const confirmedPlayersList = fetchedPlayers.filter(p => 
          confirmedPlayerIds.includes(p.user_id) && !absentPlayers.some(ap => ap.id === p.id)
        );
        setConfirmedPlayers(confirmedPlayersList);
        
        // Get unconfirmed players (players that haven't confirmed attendance)
        const unconfirmedPlayersList = fetchedPlayers.filter(p => 
          !confirmedPlayerIds.includes(p.user_id) && !confirmedPlayersList.some(cp => cp.id === p.id)
        );
        
        setUnconfirmedPlayers(unconfirmedPlayersList);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os jogadores confirmados",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const generateTeams = () => {
    if (confirmedPlayers.length === 0 && absentPlayers.length === 0) {
      toast({
        title: "Nenhum jogador",
        description: "Não há jogadores confirmados para gerar times",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingTeams(true);
      // Clone the confirmedPlayers array to avoid modifying the original
      const playersToUse = [...confirmedPlayers];
      
      // Parse team option
      const [teamCountStr, teamSizeStr] = selectedTeamOption.split("-");
      const teamCount = parseInt(teamCountStr.replace("teams", ""));
      const teamSize = parseInt(teamSizeStr.split("vs")[0]);
      
      const requiredPlayers = teamCount * teamSize;
      
      if (playersToUse.length < requiredPlayers) {
        toast({
          title: "Jogadores insuficientes",
          description: `São necessários ${requiredPlayers} jogadores para esta configuração de times`,
          variant: "destructive",
        });
        setIsGeneratingTeams(false);
        return;
      }
      
      // Sort players by skill level
      playersToUse.sort((a, b) => b.average_rating - a.average_rating);
      
      // Initialize teams
      const generatedTeams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
        id: i + 1,
        name: `Time ${i + 1}`,
        players: [],
        average_rating: 0
      }));
      
      // Distribute players using snake draft
      for (let i = 0; i < teamSize; i++) {
        const isReversed = i % 2 === 1;
        const teamsOrder = isReversed ? [...Array(teamCount).keys()].reverse() : [...Array(teamCount).keys()];
        
        for (const teamIndex of teamsOrder) {
          if (playersToUse.length > 0) {
            const player = playersToUse.shift()!;
            generatedTeams[teamIndex].players.push(player);
          }
        }
      }
      
      // Calculate average rating for each team
      generatedTeams.forEach(team => {
        const totalRating = team.players.reduce((sum, player) => sum + player.average_rating, 0);
        team.average_rating = team.players.length > 0 ? totalRating / team.players.length : 0;
      });
      
      setTeams(generatedTeams);
      setActiveTab("result");
      
      toast({
        title: "Times gerados",
        description: `${teamCount} times com ${teamSize} jogadores cada foram gerados com sucesso`,
      });
    } catch (error) {
      console.error("Error generating teams:", error);
      toast({
        title: "Erro ao gerar times",
        description: "Ocorreu um erro ao gerar os times",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTeams(false);
    }
  };

  const addUnconfirmedPlayer = () => {
    if (!selectedPlayer) return;
    
    const player = unconfirmedPlayers.find(p => p.id === selectedPlayer);
    if (!player) return;
    
    setConfirmedPlayers([...confirmedPlayers, player]);
    setUnconfirmedPlayers(unconfirmedPlayers.filter(p => p.id !== selectedPlayer));
    setSelectedPlayer("");
    
    toast({
      title: "Jogador adicionado",
      description: `${player.username} foi adicionado aos jogadores confirmados`,
    });
  };

  const removeUnconfirmedPlayer = (playerId: string) => {
    const player = confirmedPlayers.find(p => p.id === playerId);
    
    // Check if it's a player that was manually added
    if (!allConfirmations.some(c => c.user_id === player?.user_id)) {
      setConfirmedPlayers(confirmedPlayers.filter(p => p.id !== playerId));
      
      // Add back to unconfirmed players
      if (player) {
        setUnconfirmedPlayers([...unconfirmedPlayers, player]);
      }
      
      toast({
        title: "Jogador removido",
        description: `${player?.username} foi removido dos jogadores confirmados`,
      });
    } else {
      // If it's a confirmed player, mark as absent
      markPlayerAbsent(playerId);
    }
  };
  
  const markPlayerAbsent = (playerId: string) => {
    const player = confirmedPlayers.find(p => p.id === playerId);
    if (!player) return;
    
    setAbsentPlayers([...absentPlayers, player]);
    setConfirmedPlayers(confirmedPlayers.filter(p => p.id !== playerId));
    
    toast({
      title: "Jogador ausente",
      description: `${player.username} foi marcado como ausente`,
    });
  };
  
  const undoAbsent = (playerId: string) => {
    const player = absentPlayers.find(p => p.id === playerId);
    if (!player) return;
    
    setConfirmedPlayers([...confirmedPlayers, player]);
    setAbsentPlayers(absentPlayers.filter(p => p.id !== playerId));
    
    toast({
      title: "Ausência desfeita",
      description: `${player.username} foi retornado à lista de confirmados`,
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Times">
        <div className="text-center">Carregando jogadores...</div>
      </PageContainer>
    );
  }

  const availablePlayers = confirmedPlayers.length;
  const requiredPlayers = teamOptions[selectedTeamOption]?.playersCount || 0;
  const canGenerateTeams = availablePlayers >= requiredPlayers;

  return (
    <PageContainer 
      title="Times"
      description="Gere times balanceados para o próximo jogo."
    >
      <div className="mb-6">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
        />
      </div>

      {activeTab === "generate" ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Jogadores Confirmados ({confirmedPlayers.length})</h2>
              {confirmedPlayers.length === 0 ? (
                <div className="text-center py-6 text-gray-600">
                  Nenhum jogador confirmou presença ainda
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Jogador</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Média</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {confirmedPlayers.map((player) => (
                        <tr key={player.id}>
                          <td className="px-4 py-3">{player.username}</td>
                          <td className="px-4 py-3">{player.average_rating.toFixed(1)}</td>
                          <td className="px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeUnconfirmedPlayer(player.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remover
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Jogadores Ausentes ({absentPlayers.length})</h2>
              {absentPlayers.length === 0 ? (
                <div className="text-center py-6 text-gray-600">
                  Nenhum jogador marcado como ausente
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Jogador</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Média</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {absentPlayers.map((player) => (
                        <tr key={player.id}>
                          <td className="px-4 py-3">{player.username}</td>
                          <td className="px-4 py-3">{player.average_rating.toFixed(1)}</td>
                          <td className="px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => undoAbsent(player.id)}
                              className="text-volleyball-purple hover:text-volleyball-purple/80"
                            >
                              Desfazer
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="flex items-center space-x-2">
              <Select 
                value={selectedPlayer} 
                onValueChange={setSelectedPlayer}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Adicionar jogador não confirmado" />
                </SelectTrigger>
                <SelectContent>
                  {unconfirmedPlayers.map(player => (
                    <SelectItem key={player.id} value={player.id}>{player.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={addUnconfirmedPlayer} 
                disabled={!selectedPlayer}
                className="volleyball-button-primary"
              >
                Adicionar
              </Button>
            </div>
          </div>

          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configurações dos Times</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Formato dos Times</label>
                  <Select 
                    value={selectedTeamOption} 
                    onValueChange={setSelectedTeamOption}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(teamOptions).map(([value, option]) => (
                        <SelectItem key={value} value={value}>
                          {option.name} - {option.playersCount} jogadores
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {requiredPlayers} jogadores necessários
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Jogadores disponíveis:</h3>
                  <p className={`font-medium ${canGenerateTeams ? 'text-green-500' : 'text-orange-500'}`}>
                    {availablePlayers} / {requiredPlayers}
                  </p>
                  {!canGenerateTeams && (
                    <p className="text-sm text-orange-500 mt-1">
                      Faltam {requiredPlayers - availablePlayers} jogadores para este formato
                    </p>
                  )}
                </div>

                <Button
                  onClick={generateTeams}
                  disabled={!canGenerateTeams || isGeneratingTeams}
                  className="w-full volleyball-button-primary"
                >
                  {isGeneratingTeams ? "Gerando..." : "Gerar Times"}
                </Button>

                {!canGenerateTeams && availablePlayers > 0 && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Escolha um formato de time compatível com o número de jogadores disponíveis
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Times Gerados</h2>
            <Button 
              onClick={() => setActiveTab("generate")} 
              variant="outline"
            >
              Voltar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex justify-between">
                  {team.name}
                  <span className="text-volleyball-purple">
                    {team.average_rating.toFixed(1)}
                  </span>
                </h3>
                <ul className="divide-y">
                  {team.players.map((player) => (
                    <li key={player.id} className="py-2 flex justify-between">
                      <span>{player.username}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="volleyball-button-primary"
              >
                Jogar com esses times
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Começar jogo com esses times?</DialogTitle>
                <DialogDescription>
                  Você quer iniciar uma partida com esses times e ir para o placar?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {}}
                >
                  Cancelar
                </Button>
                <Button
                  className="volleyball-button-primary"
                >
                  Ir para o Placar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </PageContainer>
  );
}
