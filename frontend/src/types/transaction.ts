export interface Transaction {
  id: string;
  user_id: string;
  amount: string;
  category: string;
  description: string | null;
  transaction_date: string;
  input_method: 'manual' | 'natural_language';
  original_input: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}
