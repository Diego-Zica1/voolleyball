import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { getAllPlayers, getLatestGame, getConfirmations } from "@/lib/supabase";
import { Player, Team, Game } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, User } from "lucide-react";

// Interface estendida para incluir o Time de fora
interface ExtendedTeam extends Team {
  isExtraTeam?: boolean;
}

export default function TeamsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
  const [unconfirmedPlayers, setUnconfirmedPlayers] = useState<Player[]>([]);
  const [playerPool, setPlayerPool] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [absentPlayers, setAbsentPlayers] = useState<string[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [numberOfTeams, setNumberOfTeams] = useState<number>(2);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState<number>(6);
  const [balanceBySkill, setBalanceBySkill] = useState<boolean>(false);
  const [teams, setTeams] = useState<ExtendedTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  

  // Visitantes
  const [addVisitor, setAddVisitor] = useState(false);
  const [visitorCount, setVisitorCount] = useState(1);
  const [visitorPlayers, setVisitorPlayers] = useState<Player[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allPlayers = await getAllPlayers()
        setPlayers(allPlayers);

        const latestGame = await getLatestGame();
        if (latestGame) {
          setGame(latestGame);
          const confirmations = await getConfirmations(latestGame.id);

          const confirmedPlayersList = allPlayers.filter(player =>
            confirmations.some(conf => conf.user_id === player.user_id)
          );
          const unconfirmedPlayersList = allPlayers.filter(player =>
            !confirmations.some(conf => conf.user_id === player.user_id)
          );

          setConfirmedPlayers(confirmedPlayersList);
          setUnconfirmedPlayers(unconfirmedPlayersList);
          setPlayerPool(confirmedPlayersList);
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

  // Criação dos visitantes com todos os atributos obrigatórios
  useEffect(() => {
    if (addVisitor) {
      const newVisitors: Player[] = [];
      for (let i = 1; i <= visitorCount; i++) {
        newVisitors.push({
          id: `visitor-${i}`,
          user_id: `visitor-${i}`,
          username: `Visitante ${i}`,
          average_rating: 0,
          attributes: {
            saque: 0,
            passe: 0,
            cortada: 0,
            bloqueio: 0,
            defesa: 0,
            levantamento: 0,
            condicionamento_fisico: 0
          }
        });
      }
      setVisitorPlayers(newVisitors);
    } else {
      setVisitorPlayers([]);
    }
  }, [addVisitor, visitorCount]);

  const handleNumberOfTeamsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setNumberOfTeams(value);
    }
  };

  const handleMaxPlayersPerTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxPlayersPerTeam(value);
    }
  };

  const addPlayerToPool = () => {
    if (!selectedPlayer) return;
    const playerToAdd = unconfirmedPlayers.find(p => p.id === selectedPlayer);
    if (playerToAdd) {
      setPlayerPool(prev => [...prev, playerToAdd]);
      toast({
        title: "Jogador adicionado",
        description: `${playerToAdd.username} foi adicionado ao sorteio.`
      });
      setSelectedPlayer("");
    }
  };

  const removePlayerFromPool = (playerId: string) => {
    const playerToRemove = confirmedPlayers.find(p => p.id === playerId);
    if (playerToRemove) {
      if (absentPlayers.includes(playerId)) {
        setAbsentPlayers(prev => prev.filter(id => id !== playerId));
      } else {
        setAbsentPlayers(prev => [...prev, playerId]);
      }
    }
  };

  // Inclui visitantes no sorteio
  const getPlayersForDraw = () => {
    const presentConfirmedPlayers = confirmedPlayers.filter(
      player => !absentPlayers.includes(player.id)
    );
    const addedUnconfirmedPlayers = unconfirmedPlayers.filter(
      player => playerPool.some(p => p.id === player.id)
    );
    return [...presentConfirmedPlayers, ...addedUnconfirmedPlayers, ...visitorPlayers];
  };

  // Função para dividir array em chunks de tamanho específico
  const chunkArray = (array: Player[], size: number): Player[][] => {
    const chunks: Player[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const sortTeams = () => {
    const playersForDraw = getPlayersForDraw();

    if (playersForDraw.length === 0) {
      toast({
        title: "Sem jogadores",
        description: "Não há jogadores disponíveis para sortear times",
        variant: "destructive",
      });
      return;
    }

    setIsSorting(true);

    try {
      let playersCopy = [...playersForDraw];
      const generatedTeams: ExtendedTeam[] = [];

      // Cria os times principais
      for (let i = 1; i <= numberOfTeams; i++) {
        generatedTeams.push({
          id: i,
          name: `Seleção ${i}`,
          players: [],
          average_rating: 0,
          isExtraTeam: false
        });
      }

      // Calcula o máximo de jogadores que podem ser distribuídos nos times principais
      const maxPlayersInMainTeams = numberOfTeams * maxPlayersPerTeam;
      
      if (balanceBySkill) {
        // Ordena por habilidade (maior para menor)
        playersCopy.sort((a, b) => b.average_rating - a.average_rating);
        
        // Distribui jogadores usando padrão snake até o limite máximo
        const playersToDistribute = Math.min(playersCopy.length, maxPlayersInMainTeams);
        
        for (let i = 0; i < playersToDistribute; i++) {
          const teamIndex = i % (numberOfTeams * 2) >= numberOfTeams
            ? numberOfTeams * 2 - (i % (numberOfTeams * 2)) - 1
            : i % numberOfTeams;
          generatedTeams[teamIndex].players.push(playersCopy[i]);
        }
      } else {
        // Embaralha aleatoriamente
        playersCopy = playersCopy
          .map(value => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);

        // Distribui jogadores em chunks até o limite máximo
        const playersToDistribute = Math.min(playersCopy.length, maxPlayersInMainTeams);
        
        for (let i = 0; i < playersToDistribute; i++) {
          const teamIndex = i % numberOfTeams;
          generatedTeams[teamIndex].players.push(playersCopy[i]);
        }
      }

      // Calcula média dos times principais
      generatedTeams.forEach(team => {
        if (team.players.length > 0) {
          team.average_rating = team.players.reduce((acc, player) => acc + player.average_rating, 0) / team.players.length;
        }
      });

      // Verifica se há jogadores sobrando para o "Time de fora"
      const remainingPlayers = playersCopy.slice(maxPlayersInMainTeams);
      if (remainingPlayers.length > 0) {
        const extraTeam: ExtendedTeam = {
          id: numberOfTeams + 1,
          name: "Time de fora",
          players: remainingPlayers,
          average_rating: remainingPlayers.length > 0 
            ? remainingPlayers.reduce((acc, player) => acc + player.average_rating, 0) / remainingPlayers.length 
            : 0,
          isExtraTeam: true
        };
        generatedTeams.push(extraTeam);
      }

      setTeams(generatedTeams);

      const mainTeamsCount = generatedTeams.filter(team => !team.isExtraTeam).length;
      const extraPlayersCount = remainingPlayers.length;

      toast({
        title: "Times sorteados!",
        description: `${mainTeamsCount} times foram criados${extraPlayersCount > 0 ? ` e ${extraPlayersCount} jogador(es) ficaram de fora` : ''}.`
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
              {/* Grid para inputs lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="numberOfTeams" className="block text-sm font-medium mb-1">
                    Times
                  </label>
                  <Input
                    id="numberOfTeams"
                    type="number"
                    min="1"
                    value={numberOfTeams}
                    onChange={handleNumberOfTeamsChange}
                  />
                </div>
                <div>
                  <label htmlFor="maxPlayersPerTeam" className="block text-sm font-medium mb-1">
                    Jogadores por Time
                  </label>
                  <Input
                    id="maxPlayersPerTeam"
                    type="number"
                    min="1"
                    value={maxPlayersPerTeam}
                    onChange={handleMaxPlayersPerTeamChange}
                  />
                </div>
              </div>

              {/* Adicionar jogador não confirmado */}
              <div className="mt-2">
                <h3 className="text-md font-semibold mb-3">Adicionar jogador não confirmado</h3>
                <div className="flex space-x-2">
                  <Select
                    value={selectedPlayer}
                    onValueChange={setSelectedPlayer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar jogador" />
                    </SelectTrigger>
                    <SelectContent>
                      {unconfirmedPlayers
                        .filter(player => !playerPool.some(p => p.id === player.id))
                        .map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.username}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={addPlayerToPool}
                    disabled={!selectedPlayer}
                    className="h-10 volleyball-button-primary cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="mr-1" />
                    Incluir
                  </Button>
                </div>
              </div>

              {/* Switch para adicionar visitantes */}
              <div className="flex items-center space-x-2 mt-6 pb-6 pt-6 border-t border-b border-gray-200 dark:border-gray-700">
                <Switch
                  id="addVisitor"
                  checked={addVisitor}
                  onCheckedChange={setAddVisitor}
                />
                <label htmlFor="addVisitor" className="text-sm font-medium">
                  Adicionar Visitante(s)
                </label>
                {addVisitor && (
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={visitorCount}
                    onChange={e => setVisitorCount(Number(e.target.value))}
                    className="w-24 ml-2"
                    placeholder="Qtd."
                  />
                )}
              </div>

              {/* <div className="flex items-center space-x-2 dark:bg-gray-800 pb-6 pt-2 border-b border-gray-200 dark:border-gray-700">
                <Switch
                  id="balanceBySkill"
                  checked={balanceBySkill}
                  onCheckedChange={setBalanceBySkill}
                />
                <label htmlFor="balanceBySkill" className="text-sm font-medium">
                  Balancear por Habilidade
                </label>
              </div>  */}

              {/* Jogadores ausentes */}
              {absentPlayers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-md font-semibold mb-3">Jogadores confirmados ausentes</h3>
                  <ul className="space-y-1">
                    {absentPlayers.map(playerId => {
                      const player = confirmedPlayers.find(p => p.id === playerId);
                      return player ? (
                        <li key={playerId} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
                          <span>{player.username}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlayerFromPool(playerId)}
                          >
                            <X size={14} />
                          </Button>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
              {confirmedPlayers.length === 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhum jogador confirmado para este jogo!
                  </p>
                </div>
              )}

              <Button
                onClick={sortTeams}
                disabled={isSorting || getPlayersForDraw().length === 0}
                className="w-full mt-2 volleyball-button-primary"
              >
                {isSorting ? "Sorteando Times..." : "Sortear Times"}
              </Button>

              <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <p>Jogadores disponíveis: {getPlayersForDraw().length}</p>
                <p>Jogadores nos times principais: {Math.min(getPlayersForDraw().length, numberOfTeams * maxPlayersPerTeam)}</p>
                <p>Jogadores de fora: {Math.max(0, getPlayersForDraw().length - (numberOfTeams * maxPlayersPerTeam))}</p>
              </div>
            </div>
          </div>

          {/* Lista de jogadores confirmados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Jogadores Confirmados</h2>
            {confirmedPlayers.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {confirmedPlayers.map(player => (
                  <li key={player.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-purple-500" />
                      <span className={absentPlayers.includes(player.id) ? 'line-through text-gray-400' : ''}>
                        {player.username}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayerFromPool(player.id)}
                      className={absentPlayers.includes(player.id) ? "text-gray bg-green-200 hover:bg-green-200/50 dark:text-green-500 dark:bg-black/90 dark:hover:bg-black/50" : "text-gray bg-purple-200 hover:bg-purple-200/50 dark:text-purple-500 dark:bg-black/90 dark:hover:bg-black/50"}
                    >
                      {absentPlayers.includes(player.id) ? "Incluir" : "Marcar Ausente"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum jogador confirmado para este jogo
              </p>
            )}
          </div>

          {/* Lista de jogadores não confirmados adicionados e visitantes */}
          {(playerPool.some(p => !confirmedPlayers.some(cp => cp.id === p.id)) || visitorPlayers.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Jogadores Não Confirmados (Adicionados)</h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {playerPool
                  .filter(p => !confirmedPlayers.some(cp => cp.id === p.id))
                  .map(player => (
                    <li key={player.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <User size={16} className="mr-2 text-purple-500" />
                        <span>{player.username}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPlayerPool(prev => prev.filter(p => p.id !== player.id))}
                        className="text-red-800 bg-red-200 hover:bg-red-200/50 dark:text-red-500 dark:bg-black/90 dark:hover:bg-black/50"
                      >
                        Remover
                      </Button>
                    </li>
                  ))
                }
                {visitorPlayers.map(visitor => (
                  <li key={visitor.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-purple-500" />
                      <span>{visitor.username}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Times sorteados */}
        {teams.map((team, index) => (
          <div key={team.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${team.isExtraTeam ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                {team.name}
              </h2>
              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                team.isExtraTeam 
                  ? 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-white'
                  : index === 0 
                    ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-white' 
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-white'
              }`}>
                Média: {team.average_rating.toFixed(1)}
              </div>
            </div>

            {team.players.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {team.players.map(player => (
                  <li key={player.id} className="flex justify-left items-center py-2 border-b last:border-0">
                    <User size={16} className={`mr-2 ${team.isExtraTeam ? 'text-orange-500' : 'text-purple-500'}`} />
                    <span>{player.username}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-4"></span>
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
