
import React, { useState, useEffect } from 'react';
import { AppState, Debtor } from '../types';
import { db, SupabaseConfig } from '../services/db';
import { Plus, Trash2, Check, X, Minus, UserPlus, BarChart3, Trophy, Eye, EyeOff, Loader2, Settings, Database, ExternalLink, Terminal } from 'lucide-react';

interface AdminPanelProps {
  state: AppState;
  onUpdate: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ state, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<SupabaseConfig>({ url: '', key: '' });
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    const currentConfig = db.getConfig();
    if (currentConfig) setConfig(currentConfig);
    setGeminiKey(localStorage.getItem('guaravita_gemini_key') || '');
  }, []);

  const handleSaveConfig = () => {
    if (!config.url || !config.key) return alert("Preencha os dois campos do Supabase!");
    db.saveConfig(config);
    if (geminiKey) {
      localStorage.setItem('guaravita_gemini_key', geminiKey);
    }
    alert("Configuração salva!");
    onUpdate();
  };

  const handleAddDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsProcessing('add');
    try {
      await db.addDebtor(newName);
      await onUpdate();
      setNewName('');
    } catch (err) {
      alert("Erro ao adicionar. Verifique a configuração do banco.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUpdateAmount = async (id: string, delta: number) => {
    setIsProcessing(`amount-${id}`);
    try {
      await db.updateAmount(id, delta);
      await onUpdate();
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleVisibility = async (debtor: Debtor) => {
    setIsProcessing(`vis-${debtor.id}`);
    try {
      await db.toggleVisibility(debtor.id, !!debtor.hidden);
      await onUpdate();
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará o caloteiro e todos os seus pedidos.')) return;
    setIsProcessing(`del-${id}`);
    try {
      await db.removeDebtor(id);
      await onUpdate();
    } finally {
      setIsProcessing(null);
    }
  };

  const handleProcessRequest = async (requestId: string, debtorId: string, approved: boolean) => {
    setIsProcessing(`req-${requestId}`);
    try {
      await db.processRequest(requestId, debtorId, approved);
      await onUpdate();
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingRequests = state.requests.filter(r => r.status === 'pending');
  const visibleDebtors = state.debtors.filter(d => !d.hidden);
  const totalVisibleDebts = visibleDebtors.reduce((acc, curr) => acc + curr.amount, 0);
  const rankedDebtors = [...visibleDebtors]
    .filter(d => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-8 animate-fade-in relative pb-10">
      {isProcessing && (
        <div className="fixed top-4 right-4 z-[200] bg-orange-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-pulse">
          <Loader2 className="animate-spin" size={16} /> Sincronizando...
        </div>
      )}

      {/* 1. Supabase Setup & Config */}
      <section className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full px-6 py-4 flex items-center justify-between bg-orange-50 hover:bg-orange-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="text-orange-600" size={20} />
            <span className="font-bold text-orange-900">Configurações de Banco de Dados</span>
          </div>
          <div className="text-xs font-bold text-orange-400">
            {showConfig ? 'Fechar' : 'Configurar'}
          </div>
        </button>

        {showConfig && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Supabase URL</label>
                <input
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://suaid.supabase.co"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Anon Key</label>
                <input
                  type="password"
                  value={config.key}
                  onChange={(e) => setConfig({ ...config, key: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest text-indigo-600">Google Gemini API Key (Opcional se houver Env)</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
              />
              <p className="text-[10px] text-indigo-400 font-medium">Permite que o Rayan "fale" sobre as dívidas.</p>
            </div>

            <button
              onClick={handleSaveConfig}
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-100"
            >
              <Database size={18} /> Salvar e Conectar
            </button>

            <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative group">
              <div className="flex items-center gap-2 mb-4 text-orange-400">
                <Terminal size={20} />
                <span className="font-bold text-sm tracking-wider uppercase">Setup do Banco (SQL Editor)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Copie e cole isso no "SQL Editor" do seu Supabase para criar as tabelas:</p>
              <pre className="text-[10px] sm:text-xs font-mono bg-black/40 p-4 rounded-xl border border-white/5 overflow-x-auto select-all leading-relaxed">
                {`CREATE TABLE IF NOT EXISTS debtors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  amount int4 DEFAULT 0,
  hidden boolean DEFAULT false,
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debtor_id uuid REFERENCES debtors(id),
  debtor_name text,
  status text DEFAULT 'pending',
  timestamp timestamptz DEFAULT now()
);`}
              </pre>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-300 hover:text-orange-200 transition-colors"
              >
                Abrir Painel do Supabase <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </section>

      {/* 2. Quick Stats & Ranking Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="text-orange-600" /> Resumo de Pendências (Público)
        </h2>

        {rankedDebtors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankedDebtors.map((debtor, index) => {
              const percentage = totalVisibleDebts > 0 ? ((debtor.amount / totalVisibleDebts) * 100).toFixed(1) : "0";
              return (
                <div key={debtor.id} className="relative p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:border-orange-200">
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Trophy size={10} /> CALOTEIRO MOR
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-700 truncate pr-8 uppercase text-xs tracking-wider">{debtor.name}</span>
                    <span className="text-orange-600 font-black text-lg">{debtor.amount}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span>Participação</span>
                    <span>{percentage}% do total</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 italic">
            Nenhuma dívida pública ativa para analisar.
          </div>
        )}
      </section>

      {/* 3. Add New Debtor */}
      <section className="bg-orange-50 p-6 rounded-3xl shadow-md border-2 border-orange-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-600 rounded-lg text-white">
            <UserPlus size={20} />
          </div>
          <h2 className="text-xl font-black text-orange-900">Adicionar Novo Caloteiro</h2>
        </div>

        <form onSubmit={handleAddDebtor} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isProcessing === 'add'}
              placeholder="Ex: Fulano Detal..."
              className="w-full px-5 py-3.5 bg-white border-2 border-orange-200 text-gray-900 placeholder-gray-500 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-200/50 transition-all font-semibold text-lg disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing === 'add'}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3.5 rounded-2xl transition-all font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-95 whitespace-nowrap disabled:opacity-50"
          >
            {isProcessing === 'add' ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} strokeWidth={3} />} ADICIONAR
          </button>
        </form>
      </section>

      {/* 4. Pending Requests */}
      {pendingRequests.length > 0 && (
        <section className="bg-orange-100 p-6 rounded-3xl border-2 border-orange-300 shadow-sm">
          <h2 className="text-xl font-bold text-orange-950 mb-4 flex items-center gap-2">
            <Check className="text-orange-700" /> Solicitações de Pagamento ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-orange-200">
                <div>
                  <p className="font-black text-gray-800 text-lg">{req.debtor_name}</p>
                  <p className="text-xs font-bold text-gray-400">Solicitado em: {new Date(req.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!!isProcessing}
                    onClick={() => handleProcessRequest(req.id, req.debtor_id, true)}
                    className="p-3 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-all shadow-md active:scale-90 disabled:opacity-50"
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                  <button
                    disabled={!!isProcessing}
                    onClick={() => handleProcessRequest(req.id, req.debtor_id, false)}
                    className="p-3 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-all shadow-md active:scale-90 disabled:opacity-50"
                  >
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Full List / Management Table */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Lista Geral de Gerenciamento</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-50">
                <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-widest">Status / Nome</th>
                <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-widest text-center">Quantidade</th>
                <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {state.debtors.map(debtor => (
                <tr key={debtor.id} className={`group hover:bg-slate-50/50 transition-colors ${debtor.hidden ? 'bg-gray-50/50' : ''}`}>
                  <td className="py-5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className={`font-bold text-lg ${debtor.hidden ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {debtor.name}
                        </p>
                        {debtor.hidden && (
                          <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">OCULTO DO PÚBLICO</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        disabled={!!isProcessing}
                        onClick={() => handleUpdateAmount(debtor.id, -1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-600 transition-all active:scale-90 disabled:opacity-30"
                      >
                        <Minus size={18} strokeWidth={3} />
                      </button>
                      <span className={`text-2xl font-black min-w-[2rem] text-center ${debtor.hidden ? 'text-gray-300' : 'text-orange-600'}`}>{debtor.amount}</span>
                      <button
                        disabled={!!isProcessing}
                        onClick={() => handleUpdateAmount(debtor.id, 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-600 transition-all active:scale-90 disabled:opacity-30"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </td>
                  <td className="py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={!!isProcessing}
                        onClick={() => handleToggleVisibility(debtor)}
                        className={`p-3 rounded-xl transition-all active:scale-90 ${debtor.hidden ? 'bg-orange-50 text-orange-400 hover:bg-orange-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'} disabled:opacity-50`}
                      >
                        {debtor.hidden ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                      <button
                        disabled={!!isProcessing}
                        onClick={() => handleRemove(debtor.id)}
                        className="text-red-300 hover:text-red-500 p-3 rounded-xl hover:bg-red-50 transition-all active:scale-90 disabled:opacity-50"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
