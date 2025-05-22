
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Confirmation } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MvpVotingProps {
  gameId: string;
  confirmations: Confirmation[];
  currentUserId: string;
}

export function MvpVoting({ gameId, confirmations, currentUserId }: MvpVotingProps) {
  const [firstPlace, setFirstPlace] = useState<string | null>(null);
  const [secondPlace, setSecondPlace] = useState<string | null>(null);
  const [thirdPlace, setThirdPlace] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Filter out current user from voting options
  const eligiblePlayers = confirmations.filter(player => player.user_id !== currentUserId);

  // Check if the user has already voted for this game
  useEffect(() => {
    const checkUserVoted = async () => {
      const { data, error } = await supabase
        .from('mvp_votes')
        .select('*')
        .eq('game_id', gameId)
        .eq('voter_id', currentUserId);
        
      if (error) {
        console.error("Error checking if user has voted:", error);
        return;
      }
      
      setHasVoted(data && data.length > 0);
    };
    
    if (gameId && currentUserId) {
      checkUserVoted();
    }
  }, [gameId, currentUserId]);

  const handleSubmitVote = async () => {
    if (!firstPlace && !secondPlace && !thirdPlace) {
      toast({
        title: "Erro na votação",
        description: "Selecione pelo menos um jogador para votar",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare votes for insertion
      const votes = [];
      
      if (firstPlace) {
        const player = confirmations.find(p => p.user_id === firstPlace);
        if (player) {
          votes.push({
            game_id: gameId,
            voter_id: currentUserId,
            player_id: player.user_id,
            username: player.username,
            rank: 1
          });
        }
      }
      
      if (secondPlace) {
        const player = confirmations.find(p => p.user_id === secondPlace);
        if (player) {
          votes.push({
            game_id: gameId,
            voter_id: currentUserId,
            player_id: player.user_id,
            username: player.username,
            rank: 2
          });
        }
      }
      
      if (thirdPlace) {
        const player = confirmations.find(p => p.user_id === thirdPlace);
        if (player) {
          votes.push({
            game_id: gameId,
            voter_id: currentUserId,
            player_id: player.user_id,
            username: player.username,
            rank: 3
          });
        }
      }
      
      // Insert votes
      const { error } = await supabase
        .from('mvp_votes')
        .insert(votes);
      
      if (error) throw error;
      
      toast({
        title: "Voto registrado",
        description: "Seu voto para MVP foi registrado com sucesso!",
      });
      
      setHasVoted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        title: "Erro ao votar",
        description: "Não foi possível registrar seu voto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 dark:text-gray-400">
          Obrigado pelo seu voto! Os resultados estão sendo atualizados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">1º Lugar</Label>
        <RadioGroup 
          value={firstPlace || ""}
          onValueChange={(value) => {
            if (value === secondPlace) setSecondPlace(null);
            if (value === thirdPlace) setThirdPlace(null);
            setFirstPlace(value);
          }}
          className="space-y-2"
        >
          {eligiblePlayers.map((player) => (
            <div key={`first-${player.user_id}`} className="flex items-center space-x-2">
              <RadioGroupItem 
                id={`first-${player.user_id}`} 
                value={player.user_id} 
                disabled={player.user_id === secondPlace || player.user_id === thirdPlace}
              />
              <Label htmlFor={`first-${player.user_id}`}>{player.username}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div>
        <Label className="mb-2 block">2º Lugar</Label>
        <RadioGroup 
          value={secondPlace || ""}
          onValueChange={(value) => {
            if (value === firstPlace) setFirstPlace(null);
            if (value === thirdPlace) setThirdPlace(null);
            setSecondPlace(value);
          }}
          className="space-y-2"
        >
          {eligiblePlayers.map((player) => (
            <div key={`second-${player.user_id}`} className="flex items-center space-x-2">
              <RadioGroupItem 
                id={`second-${player.user_id}`} 
                value={player.user_id} 
                disabled={player.user_id === firstPlace || player.user_id === thirdPlace}
              />
              <Label htmlFor={`second-${player.user_id}`}>{player.username}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div>
        <Label className="mb-2 block">3º Lugar</Label>
        <RadioGroup 
          value={thirdPlace || ""}
          onValueChange={(value) => {
            if (value === firstPlace) setFirstPlace(null);
            if (value === secondPlace) setSecondPlace(null);
            setThirdPlace(value);
          }}
          className="space-y-2"
        >
          {eligiblePlayers.map((player) => (
            <div key={`third-${player.user_id}`} className="flex items-center space-x-2">
              <RadioGroupItem 
                id={`third-${player.user_id}`} 
                value={player.user_id} 
                disabled={player.user_id === firstPlace || player.user_id === secondPlace}
              />
              <Label htmlFor={`third-${player.user_id}`}>{player.username}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <Button 
        className="w-full bg-volleyball-purple hover:bg-volleyball-purple/90"
        onClick={handleSubmitVote}
        disabled={isSubmitting || (!firstPlace && !secondPlace && !thirdPlace)}
      >
        {isSubmitting ? "Enviando..." : "Votar"}
      </Button>
    </div>
  );
}
