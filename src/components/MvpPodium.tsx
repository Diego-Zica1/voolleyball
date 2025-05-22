
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

type PodiumPlayer = {
  username: string;
  score: number;
  position: number;
};

interface MvpPodiumProps {
  gameId: string;
}

export function MvpPodium({ gameId }: MvpPodiumProps) {
  const [topPlayers, setTopPlayers] = useState<PodiumPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        setLoading(true);
        
        // Since the table was just created, we need to use the raw query approach
        const { data, error } = await supabase
          .rpc('get_mvp_votes_for_game', {
            game_id_param: gameId
          });
          
        if (error) {
          console.error("Error fetching MVP votes:", error);
          // If RPC fails, try direct query as fallback
          const { data: rawData, error: rawError } = await supabase
            .from('mvp_votes')
            .select('player_id, username, rank')
            .eq('game_id', gameId);
            
          if (rawError) {
            console.error("Fallback query also failed:", rawError);
            throw rawError;
          }
          
          // Process the raw data
          const playerScores = processVotesData(rawData || []);
          const sortedPlayers = sortAndLimitPlayers(playerScores);
          setTopPlayers(sortedPlayers);
        } else {
          // Process the RPC data
          const playerScores = processVotesData(data || []);
          const sortedPlayers = sortAndLimitPlayers(playerScores);
          setTopPlayers(sortedPlayers);
        }
      } catch (error) {
        console.error("Error in MVP votes processing:", error);
        // Ensure we always have 3 placeholder positions even if there's an error
        setTopPlayers([
          { username: "1º Lugar", score: 0, position: 1 },
          { username: "2º Lugar", score: 0, position: 2 },
          { username: "3º Lugar", score: 0, position: 3 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to process votes data
    const processVotesData = (votes: any[]) => {
      const playerScores = new Map<string, { username: string, score: number }>();
      
      votes.forEach(vote => {
        const points = vote.rank === 1 ? 3 : vote.rank === 2 ? 2 : 1;
        const player = playerScores.get(vote.player_id) || { username: vote.username, score: 0 };
        player.score += points;
        playerScores.set(vote.player_id, player);
      });
      
      return playerScores;
    };
    
    // Helper function to sort and limit players
    const sortAndLimitPlayers = (playerScores: Map<string, { username: string, score: number }>) => {
      const sortedPlayers = Array.from(playerScores, ([_, player]) => player)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((player, index) => ({ ...player, position: index + 1 }));
      
      // Ensure we always have 3 positions even if there aren't enough votes
      while (sortedPlayers.length < 3) {
        sortedPlayers.push({ 
          username: sortedPlayers.length === 0 ? "1º Lugar" : 
                   sortedPlayers.length === 1 ? "2º Lugar" : "3º Lugar", 
          score: 0,
          position: sortedPlayers.length + 1
        });
      }
      
      return sortedPlayers;
    };
    
    if (gameId) {
      fetchVotes();
    }
    
    // Set up realtime subscription for vote changes
    const channel = supabase
      .channel('mvp-votes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'mvp_votes' }, 
        () => {
          fetchVotes();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  if (loading) {
    return <div className="flex justify-center py-8">Carregando resultados...</div>;
  }

  return (
    <div className="flex items-end justify-center gap-4 h-48 py-4">
      {/* 2nd Place */}
      <div className="flex flex-col items-center">
        <div className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          {topPlayers[1]?.username}
        </div>
        <div 
          className="flex items-center justify-center w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-t-lg"
          title={`${topPlayers[1]?.score || 0} pontos`}
        >
          <span className="text-3xl font-bold">2</span>
        </div>
      </div>
      
      {/* 1st Place */}
      <div className="flex flex-col items-center">
        <Trophy className="text-yellow-500 w-8 h-8 mb-2" />
        <div className="text-gray-700 dark:text-gray-300 font-bold mb-2">
          {topPlayers[0]?.username}
        </div>
        <div 
          className="flex items-center justify-center w-28 h-36 bg-yellow-400 dark:bg-yellow-600 rounded-t-lg"
          title={`${topPlayers[0]?.score || 0} pontos`}
        >
          <span className="text-5xl font-bold text-white">1</span>
        </div>
      </div>
      
      {/* 3rd Place */}
      <div className="flex flex-col items-center">
        <div className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          {topPlayers[2]?.username}
        </div>
        <div 
          className="flex items-center justify-center w-20 h-16 bg-amber-600 dark:bg-amber-700 rounded-t-lg"
          title={`${topPlayers[2]?.score || 0} pontos`}
        >
          <span className="text-2xl font-bold">3</span>
        </div>
      </div>
    </div>
  );
}
