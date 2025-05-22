
import { supabase } from "@/integrations/supabase/client";
import { MvpVote } from "@/types";

export const getMvpVotes = async (gameId: string): Promise<any[]> => {
  try {
    console.log("Fetching MVP votes for game:", gameId);
    
    // Try using the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_mvp_votes_for_game', { 
        game_id_param: gameId 
      });
    
    if (rpcError) {
      console.log("RPC error, falling back to direct query:", rpcError);
      
      // Fallback to direct query if RPC fails
      const { data, error } = await supabase
        .from('mvp_votes')
        .select('player_id, username, rank')
        .eq('game_id', gameId);
        
      if (error) {
        throw error;
      }
      
      return data || [];
    }
    
    return rpcData || [];
  } catch (error) {
    console.error("Error in getMvpVotes:", error);
    return [];
  }
};

export const addMvpVote = async (vote: Omit<MvpVote, 'id' | 'created_at'>): Promise<string | null> => {
  try {
    console.log("Adding MVP vote:", vote);
    
    // Try using the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('insert_mvp_vote', {
        game_id_param: vote.game_id,
        voter_id_param: vote.voter_id,
        player_id_param: vote.player_id,
        username_param: vote.username,
        rank_param: vote.rank
      });
      
    if (rpcError) {
      console.log("RPC error, falling back to direct insert:", rpcError);
      
      // Fallback to direct insert if RPC fails
      const { data, error } = await supabase
        .from('mvp_votes')
        .insert(vote)
        .select('id')
        .single();
        
      if (error) {
        throw error;
      }
      
      return data?.id || null;
    }
    
    return rpcData;
  } catch (error) {
    console.error("Error in addMvpVote:", error);
    throw error;
  }
};

export const hasUserVoted = async (gameId: string, userId: string): Promise<boolean> => {
  try {
    console.log("Checking if user has voted:", gameId, userId);
    
    // Try using the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_user_votes', {
        game_id_param: gameId,
        voter_id_param: userId
      });
      
    if (rpcError) {
      console.log("RPC error, falling back to direct query:", rpcError);
      
      // Fallback to direct query if RPC fails
      const { data, error } = await supabase
        .from('mvp_votes')
        .select('id')
        .eq('game_id', gameId)
        .eq('voter_id', userId);
        
      if (error) {
        throw error;
      }
      
      return data !== null && data.length > 0;
    }
    
    return !!rpcData;
  } catch (error) {
    console.error("Error in hasUserVoted:", error);
    return false;
  }
};
