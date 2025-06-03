export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  created_at: string;
  monthly_payer: boolean;  // Indicates if the user pays monthly
}

export interface Player {
  id: string;
  user_id: string;
  username: string;
  attributes: PlayerAttributes;
  average_rating: number;
}

export interface PlayerAttributes {
  saque: number;
  passe: number;
  cortada: number;
  bloqueio: number;
  defesa: number;
  levantamento: number;
  condicionamento_fisico: number;
}

export interface Game {
  id: string;
  date: string;
  time: string;
  location: string;
  max_players: number;
  created_by: string;
  created_at: string;
  map_location?: string | null;
}

export interface Confirmation {
  id: string;
  game_id: string;
  user_id: string;
  username: string;
  confirmed_at: string;
}

export interface Team {
  id: number;
  name: string;
  players: Player[];
  average_rating: number;
}

export interface Payment {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  payment_type: 'monthly' | 'weekly' | string;
  receipt_url: string | null;
  status: 'pending' | 'approved' | string;
  created_at: string;
}

export interface FinanceSettings {
  id?: string;
  monthly_fee: number;
  weekly_fee: number;
  monthly_goal: number;
  pix_qrcode: string;
}

export interface ThemeOptions {
  mode: 'light' | 'dark';
  colorScheme: 'purple' | 'blue' | 'green' | 'orange';
}

export interface MonthlyBalance {
  id: string;
  month: string;
  target_amount: number;
  collected_amount: number;
  balance_amount: number;
  created_at: string;
}

export interface CashWithdrawal {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  user_id: string;
  username: string;
}

export interface ScoreboardSettings {
  id?: string;
  team_a_color: string;
  team_b_color: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_font_color?: string;
  team_b_font_color?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'withdrawal';
  reference_id: string;
  amount: number;
  user_id: string;
  username: string;
  description: string;
  created_at: string;
}

export interface Event {
  id: string;
  description: string;
  date: string;
  time: string;
  location: string;
  map_location?: string | null;
  value: number;
  created_by: string;
  created_at: string;
  is_active: boolean;
  event_description?: string; // Optional field for event description
}

export interface EventConfirmation {
  id: string;
  event_id: string;
  user_id: string;
  username: string;
  confirmed_at: string;
}
