
export interface Debtor {
  id: string;
  name: string;
  amount: number;
  last_updated: string; // ISO String from Supabase
  hidden?: boolean;
}

export interface PaymentRequest {
  id: string;
  debtor_id: string;
  debtor_name: string;
  timestamp: string; // ISO String from Supabase
  status: 'pending' | 'approved' | 'rejected';
}

export type Role = 'admin' | 'guest';

export interface AppState {
  debtors: Debtor[];
  requests: PaymentRequest[];
}
