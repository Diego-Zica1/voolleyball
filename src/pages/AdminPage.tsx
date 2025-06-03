import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { 
  getAllUsers, 
  getLatestGame, 
  createGame, 
  updateUserAdmin, 
  getAllPayments,
  updatePaymentStatus,
  getScoreboardSettings,
  updateScoreboardSettings,
  updateUserMonthlyPayer
} from "@/lib/supabase";
import { Game, User, Payment } from "@/types";
import { Loader2, RefreshCw, User2 } from "lucide-react";
import { deleteUser } from "@/lib/supabase";
import { Trash2 } from "lucide-react";
import { getActiveEvent, createEvent, finalizeEvent } from "@/lib/events";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("controls");
  const [users, setUsers] = useState<User[]>([]);
  const [gameDate, setGameDate] = useState("");
  const [gameTime, setGameTime] = useState("10:00");
  const [gameLocation, setGameLocation] = useState("Arena Túnel - Quadra 01 | Entrada pela Rua Itaguara 55");
  const [gameMapLocation, setGameMapLocation] = useState("https://maps.app.goo.gl/Gzh9c2FREp2dGzCB6");
  const [maxPlayers, setMaxPlayers] = useState("18");
  const [latestGame, setLatestGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [isApprovingPayment, setIsApprovingPayment] = useState<string | null>(null);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState<string | null>(null);
  const [teamAColor, setTeamAColor] = useState("#000000"); // Default purple
  const [teamBColor, setTeamBColor] = useState("#42bd00"); // Default green
  const [teamAName, setTeamAName] = useState("TIME A");
  const [teamBName, setTeamBName] = useState("TIME B");
  const [isSavingColors, setIsSavingColors] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isRejectingPayment, setIsRejectingPayment] = useState<string | null>(null);
  const [isTogglingMonthlyPayer, setIsTogglingMonthlyPayer] = useState<string | null>(null);
  
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("12:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMapLocation, setEventMapLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventValue, setEventValue] = useState("30");
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isFinalizingEvent, setIsFinalizingEvent] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const tabs = [
    { id: "controls", label: "Gerenciar Usuários" },
    { id: "payments", label: "Pagamentos Pendentes" },
    { id: "schedule", label: "Agendar Novo Jogo" },
    { id: "scoreboard", label: "Configurar Placar" }
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
        
        // Fetch all users
        const usersList = await getAllUsers();
        setUsers(usersList);
        
        // Set default date to next Saturday
        const nextSaturday = new Date();
        nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7);
        const formattedDate = nextSaturday.toISOString().split('T')[0];
        setGameDate(formattedDate);
        
        // Get latest game
        const game = await getLatestGame();
        setLatestGame(game);
        
        // Fetch pending payments
        const payments = await getAllPayments();
        setPendingPayments(payments.filter(p => p.status === 'pending'));
        
        // Fetch scoreboard settings
        const scoreboardSettings = await getScoreboardSettings();
        if (scoreboardSettings) {
          setTeamAColor(scoreboardSettings.team_a_color);
          setTeamBColor(scoreboardSettings.team_b_color);
          setTeamAName(scoreboardSettings.team_a_name || "TIME A");
          setTeamBName(scoreboardSettings.team_b_name || "TIME B");
        }
        
        // Fetch active event
        const event = await getActiveEvent();
        setActiveEvent(event);
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
        created_by: user.id,
        map_location: gameMapLocation
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsCreatingEvent(true);
      
      await createEvent({
        description: eventName,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        map_location: eventMapLocation,
        value: parseFloat(eventValue),
        created_by: user.id,
        event_description: eventDescription
      });
      
      toast({
        title: "Evento criado",
        description: "O novo evento foi criado com sucesso",
      });
      
      // Refresh active event
      const event = await getActiveEvent();
      setActiveEvent(event);
      
      // Clear form
      setEventName("");
      setEventDate("");
      setEventTime("12:00");
      setEventLocation("");
      setEventMapLocation("");
      setEventDescription("");
      setEventValue("30");
      
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Erro ao criar evento",
        description: "Não foi possível criar o novo evento",
        variant: "destructive",
      });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleFinalizeEvent = async () => {
    if (!activeEvent) return;
    
    if (!window.confirm("Tem certeza que deseja finalizar este evento?")) return;
    
    try {
      setIsFinalizingEvent(true);
      
      await finalizeEvent(activeEvent.id);
      
      toast({
        title: "Evento finalizado",
        description: "O evento foi finalizado com sucesso",
      });
      
      setActiveEvent(null);
      
    } catch (error) {
      console.error("Error finalizing event:", error);
      toast({
        title: "Erro ao finalizar evento",
        description: "Não foi possível finalizar o evento",
        variant: "destructive",
      });
    } finally {
      setIsFinalizingEvent(false);
    }
  };

  const toggleUserMonthlyPayer = async (userId: string, monthlyPayer: boolean) => {
  try {
    setIsTogglingMonthlyPayer(userId);
    await updateUserMonthlyPayer(userId, monthlyPayer);

    setUsers(users.map(u =>
      u.id === userId ? { ...u, monthly_payer: monthlyPayer } : u
    ));

    toast({
      title: "Mensalista atualizado",
      description: `O usuário agora ${monthlyPayer ? 'é' : 'não é mais'} mensalista`,
    });
  } catch (error) {
    console.error("Error updating user monthly payer status:", error);
    toast({
      title: "Erro ao atualizar mensalista",
      description: "Não foi possível atualizar o status de mensalista",
      variant: "destructive",
    });
  } finally {
    setIsTogglingMonthlyPayer(null);
  }
};

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      setIsTogglingAdmin(userId);
      await updateUserAdmin(userId, isAdmin);
      
      // Update the local state to reflect the change
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
    } finally {
      setIsTogglingAdmin(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este usuário?")) return;
    try {
      setIsDeletingUser(userId);
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast({
        title: "Usuário deletado",
        description: "O usuário foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      toast({
        title: "Erro ao deletar usuário",
        description: "Não foi possível remover o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingUser(null);
    }
  };
  
  const handleApprovePayment = async (paymentId: string) => {
    try {
      setIsApprovingPayment(paymentId);
      
      // In a real implementation, this would update the payment status in Supabase
      await updatePaymentStatus(paymentId, 'approved');
      
      setPendingPayments(pendingPayments.filter(p => p.id !== paymentId));
      
      toast({
        title: "Pagamento aprovado",
        description: "O pagamento foi aprovado com sucesso",
      });
    } catch (error) {
      console.error("Error approving payment:", error);
      toast({
        title: "Erro ao aprovar pagamento",
        description: "Não foi possível aprovar o pagamento",
        variant: "destructive",
      });
    } finally {
      setIsApprovingPayment(null);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      setIsRejectingPayment(paymentId);
  
      await updatePaymentStatus(paymentId, 'rejected');
  
      setPendingPayments(pendingPayments.filter(p => p.id !== paymentId));
  
      toast({
        title: "Pagamento reprovado",
        description: "O pagamento foi reprovado com sucesso",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast({
        title: "Erro ao reprovar pagamento",
        description: "Não foi possível reprovar o pagamento",
        variant: "destructive",
      });
    } finally {
      setIsRejectingPayment(null);
    }
  };
  
  const handleSaveScoreboardSettings = async () => {
    try {
      setIsSavingColors(true);
      
      const success = await updateScoreboardSettings({
        team_a_color: teamAColor,
        team_b_color: teamBColor,
        team_a_name: teamAName,
        team_b_name: teamBName,
      });
      
      if (success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações do placar foram atualizadas com sucesso",
        });
      } else {
        throw new Error("Failed to update scoreboard settings");
      }
    } catch (error) {
      console.error("Error saving scoreboard settings:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível atualizar as configurações do placar",
        variant: "destructive",
      });
    } finally {
      setIsSavingColors(false);
    }
  };

  const refreshUsersList = async () => {
    try {
      setIsLoading(true);
      const usersList = await getAllUsers();
      setUsers(usersList);
      toast({
        title: "Lista atualizada",
        description: "A lista de usuários foi atualizada com sucesso",
      });
    } catch (error) {
      console.error("Error refreshing users list:", error);
      toast({
        title: "Erro ao atualizar lista",
        description: "Não foi possível atualizar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Painel de Administração">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto" />
          <p className="mt-2">Carregando painel administrativo...</p>
        </div>
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

      {activeTab === "controls" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">      
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Gerenciar Usuários</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshUsersList}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar lista
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensalista
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deletar
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Switch
                            checked={user.monthly_payer}
                            onCheckedChange={(checked) => toggleUserMonthlyPayer(user.id, checked)}
                            disabled={isTogglingMonthlyPayer === user.id}
                          />
                          {isTogglingMonthlyPayer === user.id && (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Switch 
                            checked={user.isAdmin}
                            onCheckedChange={(checked) => toggleUserAdmin(user.id, checked)}
                            disabled={isTogglingAdmin === user.id}
                          />
                          {isTogglingAdmin === user.id && (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isDeletingUser === user.id}
                          className="ml-2"
                          title="Deletar usuário"
                        >
                          <Trash2
                            className={`h-5 w-5 ${isDeletingUser === user.id ? 'animate-spin text-gray-400' : 'text-red-600 hover:text-red-800'}`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pagamentos Pendentes</h2>
          
          {pendingPayments.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Não há pagamentos pendentes para aprovação.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comprovante
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {pendingPayments.map(payment => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {payment.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`
                            px-2 py-1 text-xs font-semibold rounded-md min-w-24
                            ${payment.payment_type === 'monthly'    ? 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-100'
                              : payment.payment_type === 'weekly'     ? 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-blue-100'
                              : payment.payment_type === 'custom'  ? 'bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-100'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}
                          `}
                        >
                          {payment.payment_type === 'monthly'
                            ? 'Mensalidade'
                            : payment.payment_type === 'weekly'
                              ? 'Diária'
                              : payment.payment_type === 'custom'
                                ? 'Esporádico'
                                : 'Outro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                          R$ {payment.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.receipt_url ? (
                          <a 
                            href={payment.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-volleyball-purple hover:text-volleyball-purple-600 text-sm"
                          >
                            Ver comprovante
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Sem comprovante
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <Button
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={isApprovingPayment === payment.id || isRejectingPayment === payment.id}
                          className="bg-volleyball-green hover:bg-volleyball-green/90 text-white text-xs py-1"
                          size="sm"
                        >
                          {isApprovingPayment === payment.id ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                        <Button
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={isRejectingPayment === payment.id || isApprovingPayment === payment.id}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs py-1"
                          size="sm"
                          variant="destructive"
                        >
                          {isRejectingPayment === payment.id ? 'Reprovando...' : 'Reprovar'}
                        </Button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="space-y-6">
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
                <label htmlFor="map_location" className="block text-sm font-medium mb-1">
                  Link Google Maps
                </label>
                <Input
                  id="location"
                  type="text"
                  value={gameMapLocation}
                  onChange={(e) => setGameMapLocation(e.target.value)}
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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {activeEvent ? "Evento Ativo" : "Agendar Novo Evento"}
            </h2>
            
            {activeEvent ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-lg mb-2">{activeEvent.description}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Data: {new Date(activeEvent.date).toLocaleDateString('pt-BR')} às {activeEvent.time}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Local: {activeEvent.location}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Valor: R$ {activeEvent.value.toFixed(2)}
                  </p>
                </div>
                <Button 
                  onClick={handleFinalizeEvent}
                  disabled={isFinalizingEvent}
                  variant="destructive"
                  className="w-full"
                >
                  {isFinalizingEvent ? "Finalizando..." : "Finalizar Evento"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium mb-1">
                    Nome do Evento
                  </label>
                  <Input
                    id="eventName"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium mb-1">
                      Data
                    </label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="eventTime" className="block text-sm font-medium mb-1">
                      Horário
                    </label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="eventLocation" className="block text-sm font-medium mb-1">
                    Local
                  </label>
                  <Input
                    id="eventLocation"
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="eventMapLocation" className="block text-sm font-medium mb-1">
                    Link Google Maps
                  </label>
                  <Input
                    id="eventMapLocation"
                    type="text"
                    value={eventMapLocation}
                    onChange={(e) => setEventMapLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="eventDescription" className="block text-sm font-medium mb-1">
                    Descrição do evento
                  </label>
                  <Textarea
                    id="eventDescription"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label htmlFor="eventValue" className="block text-sm font-medium mb-1">
                    Valor (R$)
                  </label>
                  <Input
                    id="eventValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventValue}
                    onChange={(e) => setEventValue(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="volleyball-button-primary w-full mt-4" 
                  disabled={isCreatingEvent}
                >
                  {isCreatingEvent ? "Criando Evento..." : "Criar Evento"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === "scoreboard" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Configurar Cores e Nomes do Placar</h2>
          
          <div className="space-y-6">
            {/* Nome do Time A */}
            <div>
              <label htmlFor="teamAName" className="block text-sm font-medium mb-2">
                Nome do Time A
              </label>
              <Input
                id="teamAName"
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-48"
              />
            </div>
            {/* Cor do Time A */}
            <div>
              <label htmlFor="teamAColor" className="block text-sm font-medium mb-2">
                Cor do Time A
              </label>
              <div className="flex gap-4 items-center">
                <Input
                  id="teamAColor"
                  type="color"
                  value={teamAColor}
                  onChange={(e) => setTeamAColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={teamAColor}
                  onChange={(e) => setTeamAColor(e.target.value)}
                  className="w-32"
                />
                <div className="w-20 h-10 rounded" style={{ backgroundColor: teamAColor }}></div>
              </div>
            </div>
            {/* Nome do Time B */}
            <div>
              <label htmlFor="teamBName" className="block text-sm font-medium mb-2">
                Nome do Time B
              </label>
              <Input
                id="teamBName"
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-48"
              />
            </div>
            {/* Cor do Time B */}
            <div>
              <label htmlFor="teamBColor" className="block text-sm font-medium mb-2">
                Cor do Time B
              </label>
              <div className="flex gap-4 items-center">
                <Input
                  id="teamBColor"
                  type="color"
                  value={teamBColor}
                  onChange={(e) => setTeamBColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={teamBColor}
                  onChange={(e) => setTeamBColor(e.target.value)}
                  className="w-32"
                />
                <div className="w-20 h-10 rounded" style={{ backgroundColor: teamBColor }}></div>
              </div>
            </div>
            {/* Prévia do Placar */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-6">
              <h3 className="text-md font-medium mb-2">Prévia do Placar</h3>
              <div className="flex gap-4">
                <div
                  className="flex-1 h-24 rounded flex items-center justify-center"
                  style={{ backgroundColor: teamAColor }}
                >
                  <span className="text-xl font-bold text-white">{teamAName}</span>
                </div>
                <div
                  className="flex-1 h-24 rounded flex items-center justify-center"
                  style={{ backgroundColor: teamBColor }}
                >
                  <span className="text-xl font-bold text-white">{teamBName}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSaveScoreboardSettings} 
              className="w-full mt-4"
              disabled={isSavingColors}
            >
              {isSavingColors ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Padrão do Placar"
              )}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
