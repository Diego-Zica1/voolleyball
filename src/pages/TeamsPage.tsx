
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { getAllPlayers, getLatestGame, getConfirmations } from "@/lib/supabase";
import { Player, Team, Game, Confirmation } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function TeamsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [numberOfTeams, setNumberOfTeams] = useState<number>(2);
  const [balanceBySkill, setBalanceBySkill] = useState<boolean>(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get all players and their attributes
        const allPlayers = await getAllPlayers();
        setPlayers(allPlayers);
        
        // Get the latest game
        const latestGame = await getLatestGame();
        if (latestGame) {
          setGame(latestGame);
          
          // Get confirmations for this game
          const confirmations = await getConfirmations(latestGame.id);
          
          // Filter players who confirmed for this game
          const confirmedPlayersList = allPlayers.filter(player => 
            confirmations.some(conf => conf.user_id === player.user_id)
          );
          
          setConfirmedPlayers(confirmedPlayersList);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os jogadores ou confirmações",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleNumberOfTeamsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setNumberOfTeams(value);
    }
  };

  const sortTeams = () => {
    if (confirmedPlayers.length === 0) {
      toast({
        title: "Sem jogadores",
        description: "Não há jogadores confirmados para sortear times",
        variant: "destructive",
      });
      return;
    }

    setIsSorting(true);

    try {
      let playersCopy = [...confirmedPlayers];
      const generatedTeams: Team[] = [];

      // Create empty teams
      for (let i = 1; i <= numberOfTeams; i++) {
        generatedTeams.push({
          id: i,
          name: `Time ${i}`,
          players: [],
          average_rating: 0
        });
      }

      if (balanceBySkill) {
        // Sort players by skill level (descending)
        playersCopy.sort((a, b) => b.average_rating - a.average_rating);

        // Distribute players to balance teams using snake draft
        for (let i = 0; i < playersCopy.length; i++) {
          const teamIndex = i % (numberOfTeams * 2) >= numberOfTeams
            ? numberOfTeams * 2 - (i % (numberOfTeams * 2)) - 1
            : i % numberOfTeams;
          
          generatedTeams[teamIndex].players.push(playersCopy[i]);
        }
      } else {
        // Random shuffle
        playersCopy = playersCopy
          .map(value => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);

        // Distribute players equally
        for (let i = 0; i < playersCopy.length; i++) {
          const teamIndex = i % numberOfTeams;
          generatedTeams[teamIndex].players.push(playersCopy[i]);
        }
      }

      // Calculate average ratings for each team
      generatedTeams.forEach(team => {
        if (team.players.length > 0) {
          team.average_rating = team.players.reduce((acc, player) => acc + player.average_rating, 0) / team.players.length;
        }
      });

      setTeams(generatedTeams);
      
      toast({
        title: "Times sorteados!",
        description: `${numberOfTeams} times foram criados com sucesso.`
      });
    } catch (error) {
      console.error("Error sorting teams:", error);
      toast({
        title: "Erro no sorteio",
        description: "Ocorreu um erro ao sortear os times",
        variant: "destructive",
      });
    } finally {
      setIsSorting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Sorteio de Times">
        <div className="text-center">Carregando dados para sorteio...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Sorteio de Times"
      description="Configure e sorteie times equilibrados para o próximo jogo."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configurações do Sorteio</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Configure como os times serão sorteados
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="numberOfTeams" className="block text-sm font-medium mb-1">
                  Número de Times
                </label>
                <Input
                  id="numberOfTeams"
                  type="number"
                  min="1"
                  value={numberOfTeams}
                  onChange={handleNumberOfTeamsChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="balanceBySkill"
                  checked={balanceBySkill}
                  onCheckedChange={setBalanceBySkill}
                />
                <label htmlFor="balanceBySkill" className="text-sm font-medium">
                  Balancear por Habilidade
                </label>
              </div>

              <Button 
                onClick={sortTeams}
                disabled={isSorting || confirmedPlayers.length === 0}
                className="w-full mt-2 volleyball-button-primary"
              >
                {isSorting ? "Sorteando Times..." : "Sortear Times"}
              </Button>

              <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <p>Jogadores confirmados: {confirmedPlayers.length}</p>
                <p>Jogadores por time: {confirmedPlayers.length > 0 ? Math.ceil(confirmedPlayers.length / numberOfTeams) : 0}</p>
              </div>
            </div>
          </div>
        </div>

        {teams.map((team, index) => (
          <div key={team.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${index === 0 ? 'bg-green-100 text-green-800' : 'bg-cyan-100 text-cyan-800'}`}>
                Média: {team.average_rating.toFixed(1)}
              </div>
            </div>

            {team.players.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {team.players.map(player => (
                  <li key={player.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span>{player.username}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{player.average_rating.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mt-4">
                Nenhum jogador atribuído
              </p>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Clique em "Sortear Times" para criar os times
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
