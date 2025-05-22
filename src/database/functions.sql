
-- Function to check if a user has voted for a specific game
CREATE OR REPLACE FUNCTION public.check_user_votes(game_id_param UUID, voter_id_param UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.mvp_votes
    WHERE game_id = game_id_param AND voter_id = voter_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all votes for a specific game
CREATE OR REPLACE FUNCTION public.get_mvp_votes_for_game(game_id_param UUID)
RETURNS TABLE (
  player_id UUID,
  username TEXT,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mvp_votes.player_id,
    mvp_votes.username,
    mvp_votes.rank
  FROM public.mvp_votes
  WHERE mvp_votes.game_id = game_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to insert a new MVP vote
CREATE OR REPLACE FUNCTION public.insert_mvp_vote(
  game_id_param UUID,
  voter_id_param UUID,
  player_id_param UUID,
  username_param TEXT,
  rank_param INTEGER
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.mvp_votes (
    game_id,
    voter_id,
    player_id,
    username,
    rank
  ) VALUES (
    game_id_param,
    voter_id_param,
    player_id_param,
    username_param,
    rank_param
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new weekly game
CREATE OR REPLACE FUNCTION public.create_weekly_game() RETURNS UUID AS $$
DECLARE
  new_game_id UUID;
  next_saturday DATE;
BEGIN
  -- Calculate date for next Saturday
  next_saturday := CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE) + 7) % 7);
  
  -- Create a game for next Saturday
  INSERT INTO public.games (
    date,
    time,
    location,
    max_players,
    created_by
  ) VALUES (
    next_saturday,
    '19:00',
    'Arena Túnel - Quadra 01 | Entrada pela Rua Itaguara 55',
    18,
    'system'
  )
  RETURNING id INTO new_game_id;
  
  RETURN new_game_id;
END;
$$ LANGUAGE plpgsql;
