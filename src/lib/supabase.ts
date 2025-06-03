import { supabase } from '@/integrations/supabase/client';
import { User, Player, Game, Confirmation, Payment, FinanceSettings, PlayerAttributes, MonthlyBalance, CashWithdrawal, ScoreboardSettings, Transaction } from '../types';


// Client helper functions
export const getLatestGame = async (): Promise<Game | null> => {
  try {
    console.log("Fetching latest game...");
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error("Error fetching latest game:", error);
      throw error;
    }
    
    console.log("Latest game fetched:", data);
    return data;
  } catch (error) {
    console.error("Error in getLatestGame:", error);
    return null;
  }
};

export const getConfirmations = async (gameId: string): Promise<Confirmation[]> => {
  try {
    console.log("Fetching confirmations for game:", gameId);
    const { data, error } = await supabase
      .from('confirmations')
      .select('*')
      .eq('game_id', gameId);
      
    if (error) {
      console.error("Error fetching confirmations:", error);
      throw error;
    }
    
    console.log("Confirmations fetched:", data);
    return data || [];
  } catch (error) {
    console.error("Error in getConfirmations:", error);
    return [];
  }
};

export const addConfirmation = async (gameId: string, userId: string, username: string): Promise<any> => {
  try {
    console.log("Adding confirmation:", gameId, userId, username);
    const { data, error } = await supabase
      .from('confirmations')
      .insert({
        game_id: gameId,
        user_id: userId,
        username
      });
      
    if (error) {
      console.error("Error adding confirmation:", error);
      throw error;
    }
    
    console.log("Confirmation added successfully");
    return data;
  } catch (error) {
    console.error("Error in addConfirmation:", error);
    throw error;
  }
};

export const removeConfirmation = async (gameId: string, userId: string): Promise<boolean> => {
  try {
    console.log("Removing confirmation:", gameId, userId);
    const { error } = await supabase
      .from('confirmations')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error removing confirmation:", error);
      throw error;
    }
    
    console.log("Confirmation removed successfully");
    return true;
  } catch (error) {
    console.error("Error in removeConfirmation:", error);
    throw error;
  }
};

export const getPlayerAttributes = async (userId: string): Promise<Player | null> => {
  try {
    console.log("Fetching player attributes for:", userId);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error("Error fetching player attributes:", error);
      throw error;
    }
    
    console.log("Player attributes fetched:", data);
    // Convert JSON attributes to PlayerAttributes type
    if (data && typeof data.attributes === 'object') {
      return data as unknown as Player;
    }
    return null;
  } catch (error) {
    console.error("Error in getPlayerAttributes:", error);
    return null;
  }
};

export const updatePlayerAttributes = async (playerId: string, attributes: PlayerAttributes): Promise<any> => {
  try {
    console.log("Updating player attributes:", playerId, attributes);
    
    // Calculate the average rating from all attributes
    const attributeValues = Object.values(attributes).map(Number);
    const averageRating = attributeValues.reduce((a, b) => a + b, 0) / attributeValues.length;
    
    console.log("Calculated average rating:", averageRating);
    
    // Update both attributes and the average_rating
    // Cast attributes to any to bypass the type checking since we know the structure is valid
    const { data, error } = await supabase
      .from('players')
      .update({ 
        attributes: attributes as any,
        average_rating: averageRating
      })
      .eq('id', playerId)
      .select();
      
    if (error) {
      console.error("Error updating player attributes:", error);
      throw error;
    }
    
    console.log("Player attributes updated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in updatePlayerAttributes:", error);
    throw error;
  }
};

export const getAllPlayers = async (): Promise<Player[]> => {
  try {
    console.log("Fetching all players...");
    const { data, error } = await supabase
      .from('players')
      .select('*');
      
    if (error) {
      console.error("Error fetching all players:", error);
      throw error;
    }
    
    console.log("All players fetched:", data);
    // Convert JSON attributes to PlayerAttributes type for each player
    if (data && Array.isArray(data)) {
      return data.map(player => ({
        ...player,
        attributes: player.attributes as unknown as PlayerAttributes
      }));
    }
    return [];
  } catch (error) {
    console.error("Error in getAllPlayers:", error);
    return [];
  }
};

export const getFinanceSettings = async (): Promise<FinanceSettings> => {
  try {
    console.log("Fetching finance settings...");
    const { data, error } = await supabase
      .from('finance_settings')
      .select('*')
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching finance settings:", error);
      throw error;
    }
    
    console.log("Finance settings fetched:", data);
    // Return data with default values if necessary
    return data || {
      monthly_fee: 50,
      weekly_fee: 20,
      monthly_goal: 800,
      pix_qrcode: 'https://placeholder.com/qrcode'
    };
  } catch (error) {
    console.error("Error in getFinanceSettings:", error);
    return {
      monthly_fee: 50,
      weekly_fee: 20,
      monthly_goal: 800,
      pix_qrcode: 'https://placeholder.com/qrcode'
    };
  }
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'created_at'>): Promise<any> => {
  try {
    console.log("Adding payment:", payment);
    const { data, error } = await supabase
      .from('payments')
      .insert(payment);
      
    if (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
    
    console.log("Payment added successfully");
    return data;
  } catch (error) {
    console.error("Error in addPayment:", error);
    throw error;
  }
};

export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    console.log("Fetching all payments...");
    const { data, error } = await supabase
      .from('payments')
      .select('*');
      
    if (error) {
      console.error("Error fetching all payments:", error);
      throw error;
    }
    
    console.log("All payments fetched:", data);
    // Cast the payment_type to ensure it matches our type definition
    if (data && Array.isArray(data)) {
      return data as unknown as Payment[];
    }
    return [];
  } catch (error) {
    console.error("Error in getAllPayments:", error);
    return [];
  }
};

export const createGame = async (game: Omit<Game, 'id' | 'created_at'>): Promise<any> => {
  try {
    console.log("Creating game:", game);
    const { data, error } = await supabase
      .from('games')
      .insert(game);
      
    if (error) {
      console.error("Error creating game:", error);
      throw error;
    }
    
    console.log("Game created successfully");
    return data;
  } catch (error) {
    console.error("Error in createGame:", error);
    throw error;
  }
};

export const updateUserAdmin = async (userId: string, isAdmin: boolean): Promise<any> => {
  try {
    console.log("Updating user admin status:", userId, isAdmin);
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating user admin status:", error);
      throw error;
    }
    
    console.log("User admin status updated successfully");
    return data;
  } catch (error) {
    console.error("Error in updateUserAdmin:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error("Erro ao deletar usuário:", error);
      throw error;
    }
    console.log("Usuário deletado com sucesso");
  } catch (error) {
    console.error("Erro em deleteUser:", error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId: string, status: 'pending' | 'approved' | 'rejected'): Promise<any> => {
  try {
    console.log("Updating payment status:", paymentId, status);
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId);
      
    if (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
    
    console.log("Payment status updated successfully");
    return data;
  } catch (error) {
    console.error("Error in updatePaymentStatus:", error);
    throw error;
  }
};

// Function to initialize test data
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Check if we already have any games
    const { data: existingGames, error: gamesError } = await supabase
      .from('games')
      .select('id')
      .limit(1);
      
    if (gamesError) {
      console.error("Error checking existing games:", gamesError);
    }
    
    // If no games exist, create a default one
    if (!existingGames || existingGames.length === 0) {
      console.log("No games found, creating default game...");
      await createGame({
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        location: 'Arena Túnel - Quadra 01 | Entrada pela Rua Itaguara 55',
        max_players: 18,
        created_by: 'system'
      });
    }
    
    // Check if we already have finance settings
    const { data: existingSettings, error: settingsError } = await supabase
      .from('finance_settings')
      .select('id')
      .limit(1);
      
    if (settingsError) {
      console.error("Error checking existing finance settings:", settingsError);
    }
    
    // If no settings exist, create default ones
    if (!existingSettings || existingSettings.length === 0) {
      console.log("No finance settings found, creating default settings...");
      const { error } = await supabase
        .from('finance_settings')
        .insert({
          monthly_fee: 50.0,
          weekly_fee: 20.0,
          monthly_goal: 800.0,
          pix_qrcode: 'https://placeholder.com/qrcode'
        });
        
      if (error) {
        console.error("Error creating default finance settings:", error);
      }
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching all users...");
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
    
    console.log("All users fetched:", data);
    // Convert database structure to match User type
    if (data && Array.isArray(data)) {
      return data.map(profile => ({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        isAdmin: profile.is_admin,
        created_at: profile.created_at,
        monthly_payer: profile.monthly_payer,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
};

export const updateUserMonthlyPayer = async (userId: string, monthlyPayer: boolean): Promise<any> => {
  try {
    console.log("Updating user monthly payer status:", userId, monthlyPayer);
    const { data, error } = await supabase
      .from('profiles')
      .update({ monthly_payer: monthlyPayer })
      .eq('id', userId);

    if (error) {
      console.error("Error updating user monthly payer status:", error);
      throw error;
    }

    console.log("User monthly payer status updated successfully");
    return data;
  } catch (error) {
    console.error("Error in updateUserMonthlyPayer:", error);
    throw error;
  }
};

export const getMonthlyBalance = async (): Promise<MonthlyBalance[]> => {
  try {
    console.log("Fetching monthly balance...");
    const { data, error } = await supabase
      .from('monthly_balance')
      .select('*')
      .order('month', { ascending: false });
      
    if (error) {
      console.error("Error fetching monthly balance:", error);
      throw error;
    }
    
    console.log("Monthly balance fetched:", data);
    return data || [];
  } catch (error) {
    console.error("Error in getMonthlyBalance:", error);
    return [];
  }
};

export const getCurrentMonthBalance = async (): Promise<number> => {
  try {
    console.log("Calculando saldo atual...");
    const { data, error } = await supabase.rpc('get_current_balance');
    
    if (error) {
      console.error("Erro ao calcular saldo atual:", error);
      return 0;
    }
    
    console.log("Saldo atual calculado:", data);
    return data || 0;
  } catch (error) {
    console.error("Erro em getCurrentMonthBalance:", error);
    return 0;
  }
};

export const addCashWithdrawal = async (withdrawal: Omit<CashWithdrawal, 'id' | 'created_at'>): Promise<any> => {
  try {
    console.log("Adding cash withdrawal:", withdrawal);
    const { data, error } = await supabase
      .from('cash_withdrawals')
      .insert(withdrawal);
      
    if (error) {
      console.error("Error adding cash withdrawal:", error);
      throw error;
    }
    
    console.log("Cash withdrawal added successfully");
    return data;
  } catch (error) {
    console.error("Error in addCashWithdrawal:", error);
    throw error;
  }
};

export const getCashWithdrawals = async (): Promise<CashWithdrawal[]> => {
  try {
    console.log("Fetching cash withdrawals...");
    const { data, error } = await supabase
      .from('cash_withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching cash withdrawals:", error);
      throw error;
    }
    
    console.log("Cash withdrawals fetched:", data);
    return data || [];
  } catch (error) {
    console.error("Error in getCashWithdrawals:", error);
    return [];
  }
};

export const getScoreboardSettings = async (): Promise<ScoreboardSettings | null> => {
  try {
    console.log("Fetching scoreboard settings...");
    const { data, error } = await supabase
      .from('scoreboard_settings')
      .select('*')
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching scoreboard settings:", error);
      throw error;
    }
    
    console.log("Scoreboard settings fetched:", data);
    return data;
  } catch (error) {
    console.error("Error in getScoreboardSettings:", error);
    return null;
  }
};

export const updateScoreboardSettings = async (settings: Partial<ScoreboardSettings>): Promise<boolean> => {
  try {
    console.log("Updating scoreboard settings:", settings);
    const { data: existingSettings } = await supabase
      .from('scoreboard_settings')
      .select('id')
      .limit(1);

    let error;

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('scoreboard_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings[0].id);
      
      error = updateError;
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from('scoreboard_settings')
        .insert({
          ...settings,
          team_a_color: settings.team_a_color || '#000000',
          team_b_color: settings.team_b_color || '#42bd00'
        });
      
      error = insertError;
    }
    
    if (error) {
      console.error("Error updating scoreboard settings:", error);
      throw error;
    }
    
    console.log("Scoreboard settings updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateScoreboardSettings:", error);
    return false;
  }
};

export const getTransactions = async (
  page: number = 1,
  limit: number = 10,
  month?: string
): Promise<{ data: Transaction[], count: number }> => {
  try {
    console.log("Buscando transações:", page, limit, month);
    
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' });
    
    if (month) {
      // Filtrar por mês no formato 'YYYY-MM'
      const startDate = `${month}-01`;
      // Calcular a data do final do mês
      const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      query = query.gte('created_at', startDate).lte('created_at', formattedEndDate);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) {
      console.error("Erro ao buscar transações:", error);
      throw error;
    }
    
    console.log("Transações:", data, "Total:", count);
    return { 
      data: data as unknown as Transaction[],
      count: count || 0
    };
  } catch (error) {
    console.error("Erro em getTransactions:", error);
    return { data: [], count: 0 };
  }
};

export const getAvailableMonths = async (): Promise<string[]> => {
  try {
    console.log("Buscando meses disponíveis...");
    
    const { data, error } = await supabase
      .from('transactions')
      .select('created_at');
    
    if (error) {
      console.error("Erro ao buscar meses disponíveis:", error);
      throw error;
    }
    
    // Extrair meses únicos no formato 'YYYY-MM'
    const months = new Set<string>();
    data?.forEach(item => {
      const date = new Date(item.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(month);
    });
    
    const sortedMonths = Array.from(months).sort().reverse();
    console.log("Meses disponíveis:", sortedMonths);
    return sortedMonths;
  } catch (error) {
    console.error("Erro em getAvailableMonths:", error);
    return [];
  }
};
