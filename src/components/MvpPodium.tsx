
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
        
        const { data, error } = await supabase
          .from('mvp_votes')
          .select('player_id, username, rank')
          .eq('game_id', gameId);
          
        if (error) throw error;
        
        // Calculate score: rank 1 = 3 points, rank 2 = 2 points, rank 3 = 1 point
        const playerScores = new Map<string, { username: string, score: number }>();
        
        data?.forEach(vote => {
          const points = vote.rank === 1 ? 3 : vote.rank === 2 ? 2 : 1;
          const player = playerScores.get(vote.player_id) || { username: vote.username, score: 0 };
          player.score += points;
          playerScores.set(vote.player_id, player);
        });
        
        // Convert to array and sort by score
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
        
        setTopPlayers(sortedPlayers);
      } catch (error) {
        console.error("Error fetching MVP votes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (gameId) {
      fetchVotes();
    }
    
    // Set up realtime subscription to update podium when votes change
    const channel = supabase
      .channel('mvp-podium-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'mvp_votes', filter: `game_id=eq.${gameId}` }, 
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
