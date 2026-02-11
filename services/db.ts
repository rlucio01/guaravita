
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Debtor, PaymentRequest } from '../types';

// Chaves para o LocalStorage
const CONFIG_KEY = 'guaravita_supabase_config';

export interface SupabaseConfig {
  url: string;
  key: string;
}

let supabaseInstance: SupabaseClient | null = null;

export const db = {
  // Obtém a configuração atual (Env ou LocalStorage)
  getConfig: (): SupabaseConfig | null => {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY };
    }
    
    return null;
  },

  // Salva a configuração no LocalStorage
  saveConfig: (config: SupabaseConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    supabaseInstance = createClient(config.url, config.key);
  },

  // Inicializa ou retorna o cliente
  getClient: (): SupabaseClient => {
    if (supabaseInstance) return supabaseInstance;
    
    const config = db.getConfig();
    if (!config || !config.url || !config.key) {
      throw new Error("Supabase não configurado. Vá ao Painel Admin > Configurações.");
    }
    
    supabaseInstance = createClient(config.url, config.key);
    return supabaseInstance;
  },

  isConfigured: (): boolean => {
    const config = db.getConfig();
    return !!(config?.url && config?.key);
  },

  fetchState: async (): Promise<AppState> => {
    const client = db.getClient();
    const { data: debtors, error: dError } = await client
      .from('debtors')
      .select('*')
      .order('name', { ascending: true });

    const { data: requests, error: rError } = await client
      .from('requests')
      .select('*')
      .order('timestamp', { ascending: false });

    if (dError || rError) {
      console.error("Erro ao buscar dados:", dError || rError);
      return { debtors: [], requests: [] };
    }

    return { 
      debtors: debtors || [], 
      requests: requests || [] 
    };
  },

  addDebtor: async (name: string) => {
    const client = db.getClient();
    const { data, error } = await client
      .from('debtors')
      .insert([{ name, amount: 0, hidden: false, last_updated: new Date().toISOString() }])
      .select();
    
    if (error) throw error;
    return data;
  },

  updateAmount: async (id: string, delta: number) => {
    const client = db.getClient();
    const { data: current } = await client.from('debtors').select('amount').eq('id', id).single();
    const newAmount = Math.max(0, (current?.amount || 0) + delta);

    const { error } = await client
      .from('debtors')
      .update({ amount: newAmount, last_updated: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  toggleVisibility: async (id: string, currentStatus: boolean) => {
    const client = db.getClient();
    const { error } = await client
      .from('debtors')
      .update({ hidden: !currentStatus })
      .eq('id', id);

    if (error) throw error;
  },

  removeDebtor: async (id: string) => {
    const client = db.getClient();
    await client.from('requests').delete().eq('debtor_id', id);
    const { error } = await client.from('debtors').delete().eq('id', id);
    if (error) throw error;
  },

  createRequest: async (debtorId: string, debtorName: string) => {
    const client = db.getClient();
    const { error } = await client
      .from('requests')
      .insert([{ 
        debtor_id: debtorId, 
        debtor_name: debtorName, 
        status: 'pending', 
        timestamp: new Date().toISOString() 
      }]);
    if (error) throw error;
  },

  processRequest: async (requestId: string, debtorId: string, approved: boolean) => {
    const client = db.getClient();
    if (approved) {
      const { data: current } = await client.from('debtors').select('amount').eq('id', debtorId).single();
      const newAmount = Math.max(0, (current?.amount || 0) - 1);
      
      await client
        .from('debtors')
        .update({ amount: newAmount, last_updated: new Date().toISOString() })
        .eq('id', debtorId);
    }

    const { error } = await client
      .from('requests')
      .update({ status: approved ? 'approved' : 'rejected' })
      .eq('id', requestId);

    if (error) throw error;
  },
};
