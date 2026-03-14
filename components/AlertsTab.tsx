import React, { useState } from 'react';
import { RocketIcon, CopyIcon, GlobeIcon } from './Icons';
import { supabase } from '../integrations/supabase/client';
import { useSession } from '../src/contexts/SessionContext';

export const AlertsTab: React.FC = () => {
    const { session } = useSession();
    const [isTesting, setIsTesting] = useState(false);
    
    // Gera a URL única do OBS para este usuário
    const obsUrl = session?.user?.id 
        ? `${window.location.origin}/obs/alerts/${session.user.id}`
        : '';

    const handleCopyUrl = () => {
        if (obsUrl) {
            navigator.clipboard.writeText(obsUrl);
            alert('URL do OBS copiada para a área de transferência!');
        }
    };

    const handleTestAlert = async (type: 'subscriber' | 'member' | 'superchat' | 'donation') => {
        if (!session?.user?.id) return;
        
        setIsTesting(true);
        try {
            let name = 'Usuário Teste';
            let amount = '';
            let message = '';
            
            if (type === 'subscriber') name = 'João Silva';
            if (type === 'member') name = 'Maria Souza';
            if (type === 'superchat') {
                name = 'Pedro Gamer';
                amount = 'R$ 50,00';
                message = 'Amo suas lives, continua assim!!';
            }
            if (type === 'donation') {
                name = 'Lucas Anônimo';
                amount = 'R$ 10,00';
            }

            console.log("Enviando alerta para o banco de dados...", {
                user_id: session.user.id, type, name, amount, message
            });

            const { data, error } = await supabase.from('obs_alerts').insert({
                user_id: session.user.id,
                type,
                name,
                amount,
                message,
                status: 'pending'
            }).select();

            if (error) {
                console.error("Erro do Supabase ao inserir alerta:", error);
                throw error;
            }
            
            console.log("Alerta inserido com sucesso!", data);
            
        } catch (error) {
            console.error("Erro ao enviar alerta de teste:", error);
            alert("Erro ao disparar alerta de teste.");
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <RocketIcon className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold">Alertas na Tela (OBS)</h3>
                    <p className="text-gray-500 dark:text-gray-400">Configure e teste os alertas de inscritos e doações da sua live.</p>
                </div>
            </div>

            {/* Seção 1: Link do OBS */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-2xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <GlobeIcon className="w-5 h-5 text-gray-500" />
                    URL do Browser Source (OBS)
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                    Copie o link abaixo e adicione como uma fonte de "Navegador" no seu OBS Studio. 
                    Recomendamos definir a largura para 800 e a altura para 600.
                </p>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={obsUrl}
                        className="flex-1 bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300 outline-none"
                    />
                    <button 
                        onClick={handleCopyUrl}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
                    >
                        <CopyIcon className="w-5 h-5" />
                        Copiar
                    </button>
                </div>
            </div>

            {/* Seção 2: Controles de Teste */}
            <div className="p-6 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded-2xl">
                <h4 className="text-lg font-bold mb-4">Testar Alertas</h4>
                <p className="text-sm text-gray-500 mb-6">
                    Clique nos botões abaixo para simular alertas. Eles aparecerão instantaneamente no seu OBS se ele estiver configurado.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                        onClick={() => handleTestAlert('subscriber')}
                        disabled={isTesting}
                        className="p-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">🌟</span>
                        Novo Inscrito
                    </button>

                    <button 
                        onClick={() => handleTestAlert('member')}
                        disabled={isTesting}
                        className="p-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">👑</span>
                        Novo Membro
                    </button>

                    <button 
                        onClick={() => handleTestAlert('superchat')}
                        disabled={isTesting}
                        className="p-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">💰</span>
                        Super Chat
                    </button>

                    <button 
                        onClick={() => handleTestAlert('donation')}
                        disabled={isTesting}
                        className="p-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-purple-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">💳</span>
                        Doação Externa
                    </button>
                </div>
            </div>

        </div>
    );
};
