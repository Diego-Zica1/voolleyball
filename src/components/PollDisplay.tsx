
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { getActivePolls, votePoll, closePoll, type PollWithOptions } from "@/lib/polls";
import { Loader2, Edit, Power, Vote } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PollEditor } from "./PollEditor";
import { PollImageCarousel } from "./PollImageCarousel";

export function PollDisplay() {
  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [closingPollId, setClosingPollId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: string]: string[] }>({});
  const [editingVote, setEditingVote] = useState<{ [pollId: string]: boolean }>({});
  const [editDialogOpen, setEditDialogOpen] = useState<{ [pollId: string]: boolean }>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const activePolls = await getActivePolls();
      setPolls(activePolls);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (pollId: string, optionId: string, isMultiple: boolean) => {
    if (!isMultiple) {
      setSelectedOptions({ ...selectedOptions, [pollId]: [optionId] });
    } else {
      const currentSelections = selectedOptions[pollId] || [];
      const newSelections = currentSelections.includes(optionId)
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];
      setSelectedOptions({ ...selectedOptions, [pollId]: newSelections });
    }
  };

  const handleVote = async (poll: PollWithOptions) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para votar",
        variant: "destructive",
      });
      return;
    }

    const selections = selectedOptions[poll.id] || [];
    if (selections.length === 0) {
      toast({
        title: "Selecione uma opção",
        description: "Você deve selecionar pelo menos uma opção para votar",
        variant: "destructive",
      });
      return;
    }

    try {
      setVotingPollId(poll.id);
      await votePoll(poll.id, selections, user.id, user.username);
      await fetchPolls();
      setEditingVote({ ...editingVote, [poll.id]: false });
      
      toast({
        title: "Voto registrado",
        description: "Seu voto foi registrado com sucesso",
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Erro ao votar",
        description: "Não foi possível registrar seu voto",
        variant: "destructive",
      });
    } finally {
      setVotingPollId(null);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      setClosingPollId(pollId);
      await closePoll(pollId);
      await fetchPolls();
      
      toast({
        title: "Enquete desativada",
        description: "A enquete foi desativada com sucesso",
      });
    } catch (error) {
      console.error("Error closing poll:", error);
      toast({
        title: "Erro ao desativar",
        description: "Não foi possível desativar a enquete",
        variant: "destructive",
      });
    } finally {
      setClosingPollId(null);
    }
  };

  const hasUserVoted = (poll: PollWithOptions) => {
    return user && poll.votes.some(vote => vote.user_id === user.id);
  };

  const getVotePercentage = (poll: PollWithOptions, optionId: string) => {
    const totalVotes = poll.votes.length;
    if (totalVotes === 0) return 0;
    const optionVotes = poll.votes.filter(vote => vote.option_id === optionId).length;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const getVoters = (poll: PollWithOptions, optionId: string) => {
    return poll.votes.filter(vote => vote.option_id === optionId).map(vote => vote.username);
  };

  const handleEditVote = (pollId: string) => {
    setEditingVote({ ...editingVote, [pollId]: true });
    setSelectedOptions({ ...selectedOptions, [pollId]: [] });
  };

  const handleEditDialogClose = (pollId: string) => {
    setEditDialogOpen({ ...editDialogOpen, [pollId]: false });
  };

  const handleEditSuccess = () => {
    fetchPolls();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Carregando enquetes...</p>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Nenhuma enquete ativa no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {polls.map((poll) => {
        const userVoted = hasUserVoted(poll);
        const isEditingThisPoll = editingVote[poll.id];
        
        return (
          <div key={poll.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-left mb-2">
              <Vote className="h-8 w-8 mr-2" />
              <h3 className="text-xl font-semibold">{poll.title}</h3>              
            </div>
            {poll.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{poll.description}</p>
            )}
            
            {/* Carrossel de imagens - apenas se houver imagens */}
            <PollImageCarousel options={poll.options} />
            
            <div className="space-y-3">
              {poll.options.map((option) => {
                const percentage = getVotePercentage(poll, option.id);
                const voters = getVoters(poll, option.id);
                const isSelected = selectedOptions[poll.id]?.includes(option.id);
                
                return (
                  <div key={option.id} className="border dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {(!userVoted || isEditingThisPoll) && (
                        <div className="flex-shrink-0">
                          {poll.multiple_choice ? (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleOptionSelect(poll.id, option.id, true)}
                            />
                          ) : (
                            <input
                              type="radio"
                              name={`poll-${poll.id}`}
                              checked={isSelected}
                              onChange={() => handleOptionSelect(poll.id, option.id, false)}
                              className="w-4 h-4"
                            />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <p className="font-medium">{option.name}</p>
                        {userVoted && !isEditingThisPoll && (
                          <div className="mt-1">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>{percentage}%</span>
                              <span>{voters.length} voto{voters.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                              <div
                                className="bg-volleyball-purple h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            {voters.length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Votaram: {voters.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {(!userVoted || isEditingThisPoll) && (
              <Button
                onClick={() => handleVote(poll)}
                disabled={votingPollId === poll.id}
                className="volleyball-button-primary w-full mt-4"
              >
                {votingPollId === poll.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Votando...
                  </>
                ) : (
                  isEditingThisPoll ? "Confirmar Novo Voto" : "Votar"
                )}
              </Button>
            )}

            {userVoted && !isEditingThisPoll && (
              <Button
                onClick={() => handleEditVote(poll.id)}
                variant="outline"
                className="w-full mt-4"
              >
                Alterar Voto
              </Button>
            )}

            {/* Botões de Admin */}
            {user?.isAdmin && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Dialog 
                  open={editDialogOpen[poll.id] || false} 
                  onOpenChange={(open) => setEditDialogOpen({ ...editDialogOpen, [poll.id]: open })}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Editar Enquete</DialogTitle>
                    </DialogHeader>
                    <PollEditor 
                      poll={poll} 
                      onClose={() => handleEditDialogClose(poll.id)}
                      onSuccess={handleEditSuccess}
                    />
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja desativar esta enquete?")) {
                      handleClosePoll(poll.id);
                    }
                  }}
                  disabled={closingPollId === poll.id}
                  variant="destructive"
                  size="sm"
                >
                  {closingPollId === poll.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Desativando...
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
