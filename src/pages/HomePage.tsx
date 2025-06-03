
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { Game, Confirmation } from "@/types";
import { 
  getLatestGame, 
  getConfirmations, 
  addConfirmation, 
  removeConfirmation 
} from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const latestGame = await getLatestGame();
        
        if (latestGame) {
          setGame(latestGame);
          const gameConfirmations = await getConfirmations(latestGame.id);
          setConfirmations(gameConfirmations);
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do jogo",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return dateStr;
    }
  };

  const isUserConfirmed = () => {
    if (!user) return false;
    return confirmations.some(c => c.user_id === user.id);
  };

  const handleConfirm = async () => {
    if (!user || !game) return;
    
    try {
      setIsConfirming(true);
      await addConfirmation(game.id, user.id, user.username);
      setConfirmations([...confirmations, {
        id: Date.now().toString(),
        game_id: game.id,
        user_id: user.id,
        username: user.username,
        confirmed_at: new Date().toISOString()
      }]);
      
      toast({
        title: "Presença confirmada",
        description: "Sua presença foi confirmada com sucesso!",
      });
    } catch (error) {
      console.error("Error confirming presence:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar sua presença",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!user || !game) return;
    
    try {
      setIsConfirming(true);
      await removeConfirmation(game.id, user.id);
      setConfirmations(confirmations.filter(c => c.user_id !== user.id));
      
      toast({
        title: "Presença cancelada",
        description: "Sua presença foi cancelada com sucesso!",
      });
    } catch (error) {
      console.error("Error cancelling presence:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar sua presença",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const userCanCancelOthers = (userId: string) => {
    return user?.isAdmin && userId !== user.id;
  };

  const handleCancelOther = async (userId: string) => {
    if (!game) return;
    
    try {
      await removeConfirmation(game.id, userId);
      setConfirmations(confirmations.filter(c => c.user_id !== userId));
      
      toast({
        title: "Presença cancelada",
        description: "A presença do jogador foi cancelada com sucesso!",
      });
    } catch (error) {
      console.error("Error cancelling other's presence:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a presença",
        variant: "destructive",
      });
    }
  };

  const formatCapitalized = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getAvailableSpots = () => {
    if (!game) return 0;
    return game.max_players - confirmations.length;
  };

  if (isLoading) {
    return (
      <PageContainer title="Carregando...">
        <div className="flex justify-center">Carregando dados do jogo...</div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Bem-vindo">
        <div className="text-center">
          <p className="mb-4">Você precisa estar logado para visualizar os jogos.</p>
          <Button asChild>
            <a href="/login">Fazer Login</a>
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!game) {
    return (
      <PageContainer 
        title={`Bem-vindo, ${formatCapitalized(user.username)}!`}
        description="Não há jogos agendados no momento."
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="mb-4">Não há nenhum jogo agendado no momento.</p>
          {user.isAdmin && (
            <Button asChild>
              <a href="/admin">Agendar Novo Jogo</a>
            </Button>
          )}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title={`Bem-vindo, ${formatCapitalized(user.username)}!`}
      description="Confira o próximo jogo de vôlei e confirme sua presença."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-violet-50 dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Próximo Jogo</h2>
            <div className="rounded-lg bg-white dark:bg-gray-700 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <h3 className="text-lg font-medium capitalize">
                    {formatDate(game.date)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">às {game.time}</p>
                </div>
                <div className="dark:bg-volleyball-purple bg-volleyball-purple/20 dark:text-volleyball-white text-volleyball-purple rounded-full px-3 py-1 text-sm">
                  {getAvailableSpots()} vagas disponíveis
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Local: {game.location}
                  </span>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-600 px-4 py-2"
                  >
                    <a
                      href= {game.map_location}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Ver Localização
                    </a>
                  </Button>
                </div>
                <p className="text-gray-600 dark:text-gray-200 mt-1">
                  {confirmations.length} confirmados de {game.max_players} vagas
                </p>
              </div>
            </div>

            {!isUserConfirmed() ? (
              <Button 
                onClick={handleConfirm} 
                disabled={isConfirming || getAvailableSpots() <= 0}
                className="w-full mt-4 bg-volleyball-green hover:bg-volleyball-green/90"
              >
                <Check className="w-4 h-4 mr-2" />
                {isConfirming ? "Confirmando..." : "Confirmar Presença"}
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  if (window.confirm("Tem certeza que deseja cancelar sua presença?")) {
                    handleCancel();
                  }
                }} 
                disabled={isConfirming}
                variant="destructive"
                className="w-full mt-4"
              >
                <X className="w-4 h-4 mr-2" />
                {isConfirming ? "Cancelando..." : "Cancelar Presença"}
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Jogadores Confirmados ({confirmations.length})
            </h2>
            {confirmations.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                Nenhum jogador confirmado ainda
              </p>
            ) : (
              <ul className="space-y-2">
                {confirmations.map(confirmation => (
                  <li 
                    key={confirmation.id}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <span className="flex items-center">
                      {confirmation.username}
                      {confirmation.user_id === user.id && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(você)</span>
                      )}
                    </span>
                    
                    {(confirmation.user_id === user.id || userCanCancelOthers(confirmation.user_id)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-500 dark:hover:bg-red-900/20"
                        onClick={() => {
                          if (window.confirm(
                            confirmation.user_id === user.id 
                              ? "Tem certeza que deseja cancelar sua presença?" 
                              : "Tem certeza que deseja cancelar a presença deste jogador?"
                          )) {
                            confirmation.user_id === user.id 
                              ? handleCancel() 
                              : handleCancelOther(confirmation.user_id);
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
