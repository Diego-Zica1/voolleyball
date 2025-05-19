
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { getAllPlayers, updatePlayerAttributes, getPlayerAttributes } from "@/lib/supabase";
import { Player } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { Select, SelectValue, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

export default function AttributesPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const attributeNames = {
    saque: "Saque",
    passe: "Passe",
    cortada: "Cortada",
    bloqueio: "Bloqueio",
    defesa: "Defesa",
    levantamento: "Levantamento",
    condicionamento_fisico: "Condicionamento Físico"
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        const fetchedPlayers = await getAllPlayers();
        setPlayers(fetchedPlayers);
        
        // If user is not admin, auto-select their own profile
        if (user && !user.isAdmin) {
          const userPlayer = fetchedPlayers.find(p => p.user_id === user.id);
          if (userPlayer) {
            setSelectedPlayerId(userPlayer.id);
            setSelectedPlayer(userPlayer);
          }
        } else if (fetchedPlayers.length > 0) {
          setSelectedPlayerId(fetchedPlayers[0].id);
          setSelectedPlayer(fetchedPlayers[0]);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
        toast({
          title: "Erro ao carregar jogadores",
          description: "Não foi possível obter a lista de jogadores",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [user, toast]);

  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayerId(playerId);
    const player = players.find(p => p.id === playerId);
    setSelectedPlayer(player || null);
  };

  const handleAttributeChange = (attribute: string, value: number[]) => {
    if (!selectedPlayer) return;

    setSelectedPlayer({
      ...selectedPlayer,
      attributes: {
        ...selectedPlayer.attributes,
        [attribute]: value[0]
      }
    });
  };

  const saveAttributes = async () => {
    if (!selectedPlayer) return;
    
    // Only admins can save attribute changes for any player
    if (!user?.isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem salvar alterações nos atributos",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure we're sending the full attributes object
      console.log("Saving attributes for player:", selectedPlayer.id, selectedPlayer.attributes);
      await updatePlayerAttributes(selectedPlayer.id, selectedPlayer.attributes);
      
      // Update players list with the new attributes and recalculated average
      const updatedPlayers = await getAllPlayers();
      setPlayers(updatedPlayers);
      
      // Update selected player with the latest data
      const updatedSelectedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
      if (updatedSelectedPlayer) {
        setSelectedPlayer(updatedSelectedPlayer);
      }
      
      toast({
        title: "Atributos atualizados",
        description: "Os atributos foram salvos com sucesso",
      });
    } catch (error) {
      console.error("Error saving attributes:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os atributos",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Atributos dos Jogadores">
        <div className="text-center">Carregando atributos dos jogadores...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Atributos dos Jogadores"
      description="Visualize os atributos de cada jogador."
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Jogadores</h2>
            <Select 
              value={selectedPlayerId} 
              onValueChange={handlePlayerChange}
              disabled={!user?.isAdmin && !!user}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um jogador" />
              </SelectTrigger>
              <SelectContent>
                {players.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Estatísticas dos Jogadores</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Jogador</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Média</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {players.map(player => (
                      <tr key={player.id}>
                        <td className="px-4 py-3">{player.username}</td>
                        <td className="px-4 py-3">{player.average_rating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {selectedPlayer && (
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Atributos de {selectedPlayer.username}
              </h2>
              <div className="space-y-6">
                {Object.entries(selectedPlayer.attributes).map(([attr, value]) => (
                  <div key={attr} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor={attr} className="text-sm font-medium">
                        {attributeNames[attr as keyof typeof attributeNames]}
                      </label>
                      <span className="text-volleyball-purple font-semibold">
                        {value}
                      </span>
                    </div>
                    <Slider
                      id={attr}
                      value={[value]}
                      max={10}
                      min={0}
                      step={1}
                      disabled={!user?.isAdmin}
                      onValueChange={(newValue) => handleAttributeChange(attr, newValue)}
                      className="volleyball-slider-track"
                    />
                  </div>
                ))}

                {user?.isAdmin && (
                  <button
                    onClick={saveAttributes}
                    disabled={isSaving}
                    className="volleyball-button-primary w-full mt-4"
                  >
                    {isSaving ? "Salvando..." : "Salvar Atributos"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
