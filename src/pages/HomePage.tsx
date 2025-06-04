import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Game, Confirmation, Event, EventConfirmation } from "@/types";
import { 
  getLatestGame, 
  getConfirmations, 
  addConfirmation, 
  removeConfirmation 
} from "@/lib/supabase";
import { 
  getActiveEvent, 
  getEventConfirmations, 
  addEventConfirmation, 
  removeEventConfirmation, 
  updateEventPayment,
  revertEventPayment
} from "@/lib/events";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Trash } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, DollarSign, Beef, Volleyball, SquareCheckBig } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [eventConfirmations, setEventConfirmations] = useState<EventConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingEvent, setIsConfirmingEvent] = useState(false);
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

        // Fetch active event
        const event = await getActiveEvent();
        if (event) {
          setActiveEvent(event);
          const evtConfirmations = await getEventConfirmations(event.id);
          setEventConfirmations(evtConfirmations);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
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

  const isUserConfirmedForEvent = () => {
    if (!user || !activeEvent) return false;
    return eventConfirmations.some(c => c.user_id === user.id);
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
  const navigate = useNavigate();
  const handleClick = () => {
    // Exemplo usando query string
    navigate("/contabilidade?tab=payment");
  };

  const handleEventConfirm = async () => {
    if (!user || !activeEvent) return;
    
    try {
      setIsConfirmingEvent(true);
      await addEventConfirmation(activeEvent.id, user.id, user.username);
      setEventConfirmations([...eventConfirmations, {
        id: Date.now().toString(),
        event_id: activeEvent.id,
        user_id: user.id,
        username: user.username,
        confirmed_at: new Date().toISOString(),
        event_payed: false,
      }]);
      
      toast({
        title: "Presença confirmada",
        description: "Sua presença no evento foi confirmada com sucesso!",
      });
    } catch (error) {
      console.error("Error confirming event presence:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar sua presença no evento",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingEvent(false);
    }
  };

  const handlePaymentUpdate = async (confirmation: EventConfirmation, status: boolean) => {
    try {
      if (status) {
        await updateEventPayment(activeEvent!.id, confirmation.user_id);
      } else {
        await revertEventPayment(activeEvent!.id, confirmation.user_id);
      }
      
      const updated = eventConfirmations.map(c => 
        c.id === confirmation.id ? {...c, event_payed: status} : c
      );
      
      setEventConfirmations(updated);
      toast({ 
        title: status ? "Pagamento confirmado!" : "Pagamento estornado!",
        variant: "default"
      });
    } catch (error) {
      toast({ 
        title: `Erro ao ${status ? 'confirmar' : 'estornar'} pagamento`,
        variant: "destructive" 
      });
    }
  };

  const isUserEventPayed = () => {
    if (!user || !activeEvent) return false;
    const confirmation = eventConfirmations.find(c => c.user_id === user.id);
    return confirmation ? confirmation.event_payed : false;
  };

  const handleEventCancelOther = async (userId: string) => {
    if (!activeEvent) return;
  
    try {
      await removeEventConfirmation(activeEvent.id, userId);
      setEventConfirmations(eventConfirmations.filter(c => c.user_id !== userId));
  
      toast({
        title: "Presença cancelada",
        description: "A presença do participante foi cancelada com sucesso!",
      });
    } catch (error) {
      console.error("Error cancelling other's event presence:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a presença",
        variant: "destructive",
      });
    }
  };
  

  const handleEventCancel = async () => {
    if (!user || !activeEvent) return;
    
    try {
      setIsConfirmingEvent(true);
      await removeEventConfirmation(activeEvent.id, user.id);
      setEventConfirmations(eventConfirmations.filter(c => c.user_id !== user.id));
      
      toast({
        title: "Presença cancelada",
        description: "Sua presença no evento foi cancelada com sucesso!",
      });
    } catch (error) {
      console.error("Error cancelling event presence:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar sua presença no evento",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingEvent(false);
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
        <div className="md:col-span-2 space-y-6">
          <div className="bg-violet-50 dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Próximo Jogo</h2>
            <div className="rounded-lg bg-white dark:bg-gray-700 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <h3 className="text-lg font-medium capitalize">
                    <Volleyball className="inline-block mr-2 mb-2" />
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
                <p className="text-gray-600 dark:text-green-400 mt-3">
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

          {activeEvent && (
            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Próximo Evento</h2>
              <div className="rounded-lg bg-white dark:bg-gray-700 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
                  <div className="text-center md:text-left mb-4 md:mb-0">
                    <h3 className="text-lg font-medium">
                      <Beef className="inline-block mr-2 mb-2" />
                      {activeEvent.description}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDate(activeEvent.date)} às {activeEvent.time}
                    </p>
                  </div>
                  <div className="dark:bg-volleyball-purple bg-blue-600/20 dark:text-white text-blue-600 rounded-full px-3 py-1 text-sm">
                    Valor - R$ {activeEvent.value.toFixed(2)}
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Local: {activeEvent.location}
                    </span>
                    {activeEvent.map_location && (
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-600 px-4 py-2"
                      >
                        <a
                          href={activeEvent.map_location}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          Ver Localização
                        </a>
                      </Button>
                    )}
                  </div>                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <span className="text-gray-600 dark:text-gray-200 mt-3">
                      {activeEvent.event_description || "Descrição do evento não disponível."} 
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-800 dark:bg-green-400 dark:text-gray-800 dark:hover:bg-green-600 px-4 py-2 mt-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:dark:bg-gray-800 disabled:dark:text-gray-200"
                      onClick={(e) => {
                        if (isUserEventPayed()) {
                          e.preventDefault();
                          return;
                        }
                        handleClick();
                      }}
                      disabled={isUserEventPayed()}
                    >
                      <>
                        <DollarSign className="w-4 h-4 mr-1" />
                        {isUserEventPayed() ? "Pagamento já Realizado" : "Realizar Pagamento"}
                      </>
                    </Button>
                  </div> 
                  <p className="text-gray-600 dark:text-green-400 mt-3">
                    {eventConfirmations.length} confirmados
                  </p>                 
                </div>
              </div>

              {!isUserConfirmedForEvent() ? (
                <Button 
                  onClick={handleEventConfirm} 
                  disabled={isConfirmingEvent}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 bg-volleyball-green hover:bg-volleyball-green/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isConfirmingEvent ? "Confirmando..." : "Confirmar Presença no Evento"}
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja cancelar sua presença no evento?")) {
                      handleEventCancel();
                    }
                  }} 
                  disabled={isConfirmingEvent}
                  variant="destructive"
                  className="w-full mt-4"
                >
                  <X className="w-4 h-4 mr-2" />
                  {isConfirmingEvent ? "Cancelando..." : "Cancelar Presença no Evento"}
                </Button>
              )}

              {/* Event confirmations list */}
              {eventConfirmations.length > 0 && (
                <div className="mt-4 bg-white dark:bg-gray-700 rounded-lg p-4">                  
                  <h4 className="font-medium mb-2"><SquareCheckBig className="inline-block mr-2 mb-2" /> Confirmados ({eventConfirmations.length})</h4>
                  <ul className="space-y-1">
                    {eventConfirmations.map(confirmation => (
                      <li 
                        key={confirmation.id}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 py-2 first:border-t-0"
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {confirmation.username}
                            {confirmation.user_id === user.id && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(você)</span>
                            )}
                          </span>
                          {confirmation.event_payed && (
                            <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs px-2 py-1 rounded-full">
                              Pago
                            </span>
                          )}
                        </div>
                        
                        {user.isAdmin && (
                          <div className="flex gap-2 items-center">
                            {/* Botões de Pagamento/Estorno */}
                            <div className="flex gap-2 dark:bg-gray-800 rounded-lg">
                              {!confirmation.event_payed ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-500 hover:text-green-700 hover:bg-green-500/20"
                                        onClick={async () => handlePaymentUpdate(confirmation, true)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Marcar como pago
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-500/20"
                                        onClick={async () => handlePaymentUpdate(confirmation, false)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Estornar pagamento
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            {/* Botão de Remover Confirmação */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-500 hover:text-red-600 hover:bg-red-500/20 flex gap-2 dark:bg-gray-800 rounded-lg"
                                    onClick={async () => {
                                      try {
                                        await removeEventConfirmation(activeEvent!.id, confirmation.user_id);
                                        const updated = eventConfirmations.filter(c => c.id !== confirmation.id);
                                        setEventConfirmations(updated);
                                        toast({ title: "Presença removida com sucesso!" });
                                      } catch (error) {
                                        toast({ 
                                          title: "Erro ao remover presença",
                                          variant: "destructive" 
                                        });
                                      }
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Cancelar presença no evento
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div id= "confirmed_players" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              <SquareCheckBig className="inline-block mr-2" />
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
                    className="flex justify-between items-center py-2 border-b dark:border-[#020817] last:border-0"
                  >
                    <span className="flex items-center">
                      {confirmation.username}
                      {confirmation.user_id === user.id && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(você)</span>
                      )}
                    </span>
                    
                    {(confirmation.user_id === user.id || userCanCancelOthers(confirmation.user_id)) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-500 dark:hover:bg-red-900/20 flex gap-2 dark:bg-[#020817] rounded-lg"
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
                          </TooltipTrigger>
                          <TooltipContent>
                            {confirmation.user_id === user.id
                              ? "Cancelar sua presença"
                              : "Cancelar presença deste jogador"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
