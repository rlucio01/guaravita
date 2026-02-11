
import React, { useState } from 'react';
import { AppState, Debtor } from '../types';
import { db } from '../services/db';
import { Send, Clock, Info, Loader2 } from 'lucide-react';

interface GuestPanelProps {
  state: AppState;
  onUpdate: () => Promise<void>;
}

export const GuestPanel: React.FC<GuestPanelProps> = ({ state, onUpdate }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<Set<string>>(new Set());

  const handleSendRequest = async (debtor: Debtor) => {
    if (processingId || recentRequests.has(debtor.id)) return;
    
    setProcessingId(debtor.id);
    try {
      await db.createRequest(debtor.id, debtor.name);
      await onUpdate();
      
      // Feedback temporário para evitar múltiplos cliques
      setRecentRequests(prev => new Set(prev).add(debtor.id));
      setTimeout(() => {
        setRecentRequests(prev => {
          const next = new Set(prev);
          next.delete(debtor.id);
          return next;
        });
      }, 10000);

    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const sortedDebtors = [...state.debtors]
    .filter(debtor => !debtor.hidden)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 text-blue-800 text-sm">
        <Info className="flex-shrink-0 mt-0.5" size={18} />
        <p>
          Achou que pagou? Clique em <strong>"Já Paguei!"</strong> ao lado do seu nome. 
          O Rayan vai revisar e descontar da sua conta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedDebtors.map(debtor => {
          const isPendingLocal = recentRequests.has(debtor.id);
          const isThisLoading = processingId === debtor.id;

          return (
            <div key={debtor.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 truncate">{debtor.name}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-black text-orange-600">{debtor.amount}</span>
                  <span className="text-sm font-medium text-gray-500 pb-1">Guaravitas</span>
                </div>
              </div>
              
              <button
                onClick={() => handleSendRequest(debtor)}
                disabled={debtor.amount === 0 || isPendingLocal || isThisLoading}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isPendingLocal
                    ? 'bg-green-100 text-green-700'
                    : debtor.amount === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 active:scale-95'
                } disabled:opacity-50`}
              >
                {isThisLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isPendingLocal ? (
                  <> <Clock size={18} /> Enviado!</>
                ) : (
                  <> <Send size={18} /> Já Paguei!</>
                )}
              </button>
            </div>
          );
        })}

        {sortedDebtors.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed">
            Ninguém deve nada publicamente ainda. Rayan está de boa.
          </div>
        )}
      </div>
    </div>
  );
};
