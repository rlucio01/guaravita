
import React, { useState, useEffect, useCallback } from 'react';
import { db } from './services/db';
import { geminiService } from './services/geminiService';
import { AppState, Role } from './types';
import { AdminPanel } from './components/AdminPanel';
import { GuestPanel } from './components/GuestPanel';
import { Coffee, ShieldCheck, User, Sparkles, TrendingUp, Lock, ArrowRight, X, Loader2, Database } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ debtors: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(db.isConfigured());
  const [role, setRole] = useState<Role>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [rayanMood, setRayanMood] = useState<string>("Rayan está conferindo o estoque...");
  const [isMoodLoading, setIsMoodLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!db.isConfigured()) {
      setIsConfigured(false);
      setLoading(false);
      return;
    }

    try {
      const newState = await db.fetchState();
      setState(newState);
      setIsConfigured(true);
    } catch (e) {
      console.error(e);
      setIsConfigured(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const totalDebts = state.debtors
    .filter(d => !d.hidden)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const fetchMood = useCallback(async () => {
    if (loading || !isConfigured) return;
    setIsMoodLoading(true);
    const mood = await geminiService.generateRayanMood(totalDebts);
    setRayanMood(mood);
    setIsMoodLoading(false);
  }, [totalDebts, loading, isConfigured]);

  useEffect(() => {
    fetchMood();
  }, [fetchMood]);

  const handleRoleSwitch = (newRole: Role) => {
    if (newRole === 'admin' && !isAuthenticated) {
      setShowLoginModal(true);
    } else {
      setRole(newRole);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'rayan123';
    if (password === adminPass) {
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setRole('admin');
      setLoginError(false);
      setPassword('');
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-orange-900 font-bold text-xl">Abrindo o Ledger do Rayan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <header className="guaravita-gradient text-white pt-10 pb-20 px-4 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black flex items-center justify-center md:justify-start gap-4 drop-shadow-lg tracking-tight">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Coffee className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              Guaravita Ledger
            </h1>
            <p className="mt-3 text-orange-100 font-medium text-lg opacity-90">O controle definitivo das dívidas do Rayan</p>
          </div>

          <div className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-xl border border-white/10 shadow-inner">
            <button
              onClick={() => handleRoleSwitch('guest')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${role === 'guest' ? 'bg-white text-orange-600 shadow-xl scale-105' : 'hover:bg-white/5 text-white/80'
                }`}
            >
              <User size={18} /> Público
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${role === 'admin' ? 'bg-white text-orange-600 shadow-xl scale-105' : 'hover:bg-white/5 text-white/80'
                }`}
            >
              {isAuthenticated ? <ShieldCheck size={18} /> : <Lock size={18} />} Admin
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        {!isConfigured ? (
          <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-orange-50 text-center animate-fade-in">
            <div className="w-24 h-24 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-orange-600 rotate-3">
              <Database size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-4">Banco de Dados Não Conectado</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
              O Ledger precisa de uma conexão com o Supabase para salvar as dívidas globalmente.
            </p>
            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-orange-600 font-bold bg-orange-50 py-2 px-4 rounded-full inline-block">Você é Admin! Role para baixo e configure.</p>
                <div className="h-20 flex items-center justify-center animate-bounce">
                  <ArrowRight size={32} className="rotate-90 text-orange-300" />
                </div>
                <AdminPanel state={state} onUpdate={refreshData} />
              </div>
            ) : (
              <button
                onClick={() => handleRoleSwitch('admin')}
                className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all flex items-center gap-2 mx-auto"
              >
                Entrar como Admin para Configurar <ArrowRight size={20} />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 flex items-center gap-5 transition-transform hover:scale-[1.02]">
                <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total em Aberto</p>
                  <p className="text-3xl font-black text-gray-800">{totalDebts} <span className="text-sm font-normal text-gray-400">unids</span></p>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 flex items-center gap-5 relative overflow-hidden group">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-500 group-hover:rotate-6 transition-transform">
                  <Sparkles size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rayan diz:</p>
                  <p className={`text-gray-700 font-semibold text-lg italic leading-relaxed ${isMoodLoading ? 'animate-pulse opacity-50' : ''}`}>
                    "{rayanMood}"
                  </p>
                </div>
                {isMoodLoading && (
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-[400px]">
              {role === 'admin' && isAuthenticated ? (
                <AdminPanel state={state} onUpdate={refreshData} />
              ) : (
                <GuestPanel state={state} onUpdate={refreshData} />
              )}
            </div>
          </>
        )}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-orange-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">Acesso Restrito</h2>
                  <p className="text-gray-500 font-medium">Apenas o Rayan (ou quem paga) entra aqui.</p>
                </div>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha do admin"
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border ${loginError ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100'} rounded-2xl outline-none transition-all font-medium text-lg`}
                  />
                </div>

                {loginError && (
                  <p className="text-red-500 text-sm font-bold text-center animate-bounce">Senha incorreta, vacilão!</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Acessar Painel <ArrowRight size={20} />
                </button>
                <p className="text-center text-xs text-gray-400 pt-2 italic">Dica: É o nome dele + 123</p>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 text-sm font-medium">
          Feito para o <span className="text-orange-600 font-bold">Rayan</span> • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default App;
