
export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  created_at: string;
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
  accumulated_balance: number;
  last_month_processed: string;
}

export interface ThemeOptions {
  mode: 'light' | 'dark';
  colorScheme: 'purple' | 'blue' | 'green' | 'orange';
}

export interface Withdrawal {
  id: string;
  amount: number;
  reason: string;
  created_by: string;
  created_at: string;
}
