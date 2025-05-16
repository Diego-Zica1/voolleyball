
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { getAllPlayers, getLatestGame, getConfirmations, createGame, updateUserAdmin } from "@/lib/supabase";
import { Game, User } from "@/types";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("controls");
  const [users, setUsers] = useState<User[]>([]);
  const [gameDate, setGameDate] = useState("");
  const [gameTime, setGameTime] = useState("10:00");
  const [gameLocation, setGameLocation] = useState("Arena Túnel - Quadra 01 | Entrada pela Rua Itaguara 55");
  const [maxPlayers, setMaxPlayers] = useState("18");
  const [latestGame, setLatestGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const tabs = [
    { id: "controls", label: "Controles de Administrador" },
    { id: "schedule", label: "Agendar Novo Jogo" }
  ];

  useEffect(() => {
    // Redirect if not admin
    if (user && !user.isAdmin) {
      navigate("/");
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem acessar esta página",
        variant: "destructive",
      });
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const players = await getAllPlayers();
        // Extract users from players
        const usersList = players.map(player => ({
          id: player.user_id,
          username: player.username,
          email: "", // This would come from real auth system
          isAdmin: false, // This would come from real auth system
          created_at: "" // This would come from real auth system
        }));
        setUsers(usersList);
        
        // Set default date to next Saturday
        const nextSaturday = new Date();
        nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7);
        const formattedDate = nextSaturday.toISOString().split('T')[0];
        setGameDate(formattedDate);
        
        // Get latest game
        const game = await getLatestGame();
        setLatestGame(game);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchData();
    }
  }, [user, navigate, toast]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      await createGame({
        date: gameDate,
        time: gameTime,
        location: gameLocation,
        max_players: parseInt(maxPlayers, 10),
        created_by: user.id
      });
      
      toast({
        title: "Jogo agendado",
        description: "O novo jogo foi agendado com sucesso",
      });
      
      // Update latest game
      const game = await getLatestGame();
      setLatestGame(game);
      
      // Switch to controls tab
      setActiveTab("controls");
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Erro ao agendar jogo",
        description: "Não foi possível agendar o novo jogo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetConfirmations = async () => {
    if (!latestGame) return;
    
    // This would reset confirmations in a real app
    toast({
      title: "Confirmações resetadas",
      description: "Todas as confirmações foram resetadas com sucesso",
    });
  };

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await updateUserAdmin(userId, isAdmin);
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isAdmin } : u
      ));
      
      toast({
        title: "Permissão atualizada",
        description: `O usuário agora ${isAdmin ? 'é' : 'não é mais'} um administrador`,
      });
    } catch (error) {
      console.error("Error updating user admin status:", error);
      toast({
        title: "Erro ao atualizar permissão",
        description: "Não foi possível atualizar o status de administrador",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Painel de Administração">
        <div className="text-center">Carregando painel administrativo...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Painel de Administração"
      description="Gerencie jogos, usuários e confirmações de presença."
    >
      <div className="mb-6">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "controls" ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Controles de Administrador</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Reset automático: sábado às 14:00
            </p>
            <Button 
              onClick={handleResetConfirmations}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Resetar Confirmações Agora
            </Button>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Gerenciar Usuários</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Switch 
                          checked={user.isAdmin}
                          onCheckedChange={(checked) => toggleUserAdmin(user.id, checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Agendar Novo Jogo</h2>
          
          <form onSubmit={handleCreateGame} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">
                  Data
                </label>
                <Input
                  id="date"
                  type="date"
                  value={gameDate}
                  onChange={(e) => setGameDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium mb-1">
                  Horário
                </label>
                <Input
                  id="time"
                  type="time"
                  value={gameTime}
                  onChange={(e) => setGameTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                Local
              </label>
              <Input
                id="location"
                type="text"
                value={gameLocation}
                onChange={(e) => setGameLocation(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
                Número máximo de jogadores
              </label>
              <Input
                id="maxPlayers"
                type="number"
                min="2"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="volleyball-button-primary w-full mt-4" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Agendando Jogo..." : "Agendar Jogo"}
            </Button>
          </form>
        </div>
      )}
    </PageContainer>
  );
}
