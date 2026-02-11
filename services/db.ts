
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

    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    // Valida se a URL é válida (evita PLACEHOLDER_API_KEY ou strings vazias)
    if (url && url.startsWith('http') && key) {
      return { url, key };
    }

    return null;
  },

  // Salva a configuração no LocalStorage
  saveConfig: (config: SupabaseConfig) => {
    if (!config.url || !config.url.startsWith('http')) {
      throw new Error("URL do Supabase inválida.");
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    supabaseInstance = createClient(config.url, config.key);
  },

  // Inicializa ou retorna o cliente
  getClient: (): SupabaseClient | null => {
    if (supabaseInstance) return supabaseInstance;

    const config = db.getConfig();
    if (!config || !config.url || !config.key || !config.url.startsWith('http')) {
      return null;
    }

    try {
      supabaseInstance = createClient(config.url, config.key);
      return supabaseInstance;
    } catch (e) {
      console.error("Erro ao criar cliente Supabase:", e);
      return null;
    }
  },

  isConfigured: (): boolean => {
    return db.getClient() !== null;
  },

  fetchState: async (): Promise<AppState> => {
    const client = db.getClient();
    if (!client) {
      return { debtors: [], requests: [] };
    }
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
    if (!client) return;
    const { data, error } = await client
      .from('debtors')
      .insert([{ name, amount: 0, hidden: false, last_updated: new Date().toISOString() }])
      .select();

    if (error) throw error;
    return data;
  },

  updateAmount: async (id: string, delta: number) => {
    const client = db.getClient();
    if (!client) return;
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
    if (!client) return;
    const { error } = await client
      .from('debtors')
      .update({ hidden: !currentStatus })
      .eq('id', id);

    if (error) throw error;
  },

  removeDebtor: async (id: string) => {
    const client = db.getClient();
    if (!client) return;
    await client.from('requests').delete().eq('debtor_id', id);
    const { error } = await client.from('debtors').delete().eq('id', id);
    if (error) throw error;
  },

  createRequest: async (debtorId: string, debtorName: string) => {
    const client = db.getClient();
    if (!client) return;
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
    if (!client) return;
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
