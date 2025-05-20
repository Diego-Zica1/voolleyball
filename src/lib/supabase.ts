import { supabase } from '@/integrations/supabase/client';
import { User, Player, Game, Confirmation, Payment, FinanceSettings, PlayerAttributes, MonthlyBalance, CashWithdrawal } from '../types';

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

export const updatePaymentStatus = async (paymentId: string, status: 'pending' | 'approved'): Promise<any> => {
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
        created_at: profile.created_at
      }));
    }
    return [];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
};

export const getScoreboardSettings = async (): Promise<{ team_a_color: string, team_b_color: string } | null> => {
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

export const updateScoreboardSettings = async (settings: { team_a_color: string, team_b_color: string }): Promise<boolean> => {
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
        .update(settings)
        .eq('id', existingSettings[0].id);
      
      error = updateError;
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from('scoreboard_settings')
        .insert(settings);
      
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

export const getMonthlyBalances = async (): Promise<MonthlyBalance[]> => {
  try {
    console.log("Fetching monthly balances...");
    const { data, error } = await supabase
      .from('monthly_balance')
      .select('*')
      .order('month', { ascending: false });
      
    if (error) {
      console.error("Error fetching monthly balances:", error);
      throw error;
    }
    
    console.log("Monthly balances fetched:", data);
    return data || [];
  } catch (error) {
    console.error("Error in getMonthlyBalances:", error);
    return [];
  }
};

export const calculateAndUpdateMonthlyBalance = async (): Promise<boolean> => {
  try {
    const currentDate = new Date();
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthFormatted = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    
    console.log("Calculating balance for previous month:", prevMonthFormatted);
    
    // Check if we already calculated for this month
    const { data: existingBalance } = await supabase
      .from('monthly_balance')
      .select('*')
      .eq('month', prevMonthFormatted)
      .maybeSingle();
    
    if (existingBalance) {
      console.log("Balance for this month already exists:", existingBalance);
      return false;
    }
    
    // Get finance settings for the target amount
    const financeSettings = await getFinanceSettings();
    
    // Calculate total approved payments for previous month
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'approved')
      .gte('created_at', `${prevMonthFormatted}-01`)
      .lt('created_at', `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`);
    
    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      throw paymentsError;
    }
    
    const collectedAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const targetAmount = financeSettings.monthly_goal || 800;
    const balanceAmount = collectedAmount - targetAmount;
    
    console.log(`Monthly balance calculation: collected ${collectedAmount}, target ${targetAmount}, balance ${balanceAmount}`);
    
    // Insert the new monthly balance record
    const { error: insertError } = await supabase
      .from('monthly_balance')
      .insert({
        month: prevMonthFormatted,
        target_amount: targetAmount,
        collected_amount: collectedAmount,
        balance_amount: balanceAmount
      });
    
    if (insertError) {
      console.error("Error inserting monthly balance:", insertError);
      throw insertError;
    }
    
    console.log("Monthly balance successfully calculated and inserted");
    return true;
  } catch (error) {
    console.error("Error in calculateAndUpdateMonthlyBalance:", error);
    return false;
  }
};

export const getCurrentCashBalance = async (): Promise<number> => {
  try {
    console.log("Calculating current cash balance...");
    
    // Get all monthly balances
    const { data: monthlyBalances, error: balancesError } = await supabase
      .from('monthly_balance')
      .select('balance_amount');
    
    if (balancesError) {
      console.error("Error fetching monthly balances:", balancesError);
      throw balancesError;
    }
    
    // Get all withdrawals
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('cash_withdrawals')
      .select('amount');
    
    if (withdrawalsError) {
      console.error("Error fetching withdrawals:", withdrawalsError);
      throw withdrawalsError;
    }
    
    // Sum up all monthly balances
    const totalMonthlyBalance = monthlyBalances?.reduce((sum, balance) => sum + balance.balance_amount, 0) || 0;
    
    // Sum up all withdrawals
    const totalWithdrawals = withdrawals?.reduce((sum, withdrawal) => sum + withdrawal.amount, 0) || 0;
    
    // Calculate current balance
    const currentBalance = totalMonthlyBalance - totalWithdrawals;
    
    console.log(`Current cash balance: ${currentBalance} (total balances: ${totalMonthlyBalance}, total withdrawals: ${totalWithdrawals})`);
    return currentBalance;
  } catch (error) {
    console.error("Error in getCurrentCashBalance:", error);
    return 0;
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

export const addCashWithdrawal = async (amount: number, reason: string, userId: string, username: string): Promise<any> => {
  try {
    console.log("Adding cash withdrawal:", amount, reason, userId, username);
    const { data, error } = await supabase
      .from('cash_withdrawals')
      .insert({
        amount,
        reason,
        user_id: userId,
        username
      });
      
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
