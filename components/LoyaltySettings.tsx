import React from 'react';
import { AppSettings } from '../types';
import { CrownIcon, SettingsIcon, UsersIcon, SearchIcon, PlusIcon, MinusIcon, RefreshCwIcon, TrashIcon } from './Icons';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/src/contexts/SessionContext';

interface LoyaltySettingsProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

export const LoyaltySettings: React.FC<LoyaltySettingsProps> = ({ settings, onSave }) => {
    const { session } = useSession();
    const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [pointsToUpdate, setPointsToUpdate] = React.useState<number>(100);
    const [manualUsername, setManualUsername] = React.useState('');
    const [manualAmount, setManualAmount] = React.useState<number>(100);
    const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [userPointInputs, setUserPointInputs] = React.useState<Record<string, number>>({});

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchLeaderboard = React.useCallback(async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('loyalty_points')
                .select('*')
                .eq('owner_id', session.user.id)
                .order('points', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLeaderboard(data || []);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    React.useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const handleLoyaltyChange = <K extends keyof AppSettings['loyalty']>(key: K, value: AppSettings['loyalty'][K]) => {
        onSave({
            ...settings,
            loyalty: {
                ...settings.loyalty,
                [key]: value
            }
        });
    };

    const handleDeleteUser = async (username: string) => {
        if (!session?.user?.id) return;

        const confirmed = window.confirm(`Tem certeza que deseja excluir "${username}" do sistema de pontos?`);
        if (!confirmed) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('loyalty_points')
                .delete()
                .eq('username', username)
                .eq('owner_id', session.user.id);

            if (error) throw error;

            showNotification(`Usuário ${username} removido com sucesso!`);
            fetchLeaderboard();
        } catch (err: any) {
            console.error('[LoyaltySettings] Erro ao excluir usuário:', err);
            showNotification(`Erro: ${err.message || 'Erro ao excluir usuário'}`, 'error');
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const handleManualPoints = async (username: string, amount: number) => {
        if (!session?.user?.id || !username.trim()) return;

        console.log('[LoyaltySettings] Tentando atualizar pontos:', {
            username: username.trim(),
            amount,
            owner_id: session.user.id
        });

        setIsLoading(true);
        try {
            const { error, data } = await supabase.rpc('increment_loyalty_points', {
                p_username: username.trim(),
                p_points: amount,
                p_owner_id: session.user.id
            });

            console.log('[LoyaltySettings] Resposta do RPC:', { data, error });

            if (error) {
                console.error('[LoyaltySettings] Erro detalhado:', error);
                throw error;
            }

            showNotification(`Pontos atualizados com sucesso para ${username}!`);
            fetchLeaderboard();
            if (username === manualUsername) {
                setManualUsername('');
            }
        } catch (err: any) {
            console.error('[LoyaltySettings] Erro ao atualizar pontos:', err);
            console.error('[LoyaltySettings] Detalhes do erro:', {
                message: err.message,
                details: err.details,
                hint: err.hint,
                code: err.code
            });
            showNotification(`Erro: ${err.message || 'Erro ao atualizar pontos'}`, 'error');
        } finally {
            setIsLoading(true);
            // Re-fetch to ensure loading state is cleared by fetchLeaderboard or manually
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const handleResetAllPoints = async () => {
        if (!session?.user?.id) return;

        const confirmed = window.confirm('TEM CERTEZA? Isso irá ZERAR os pontos de TODOS os usuários. Esta ação não pode ser desfeita.');
        if (!confirmed) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('loyalty_points')
                .update({ points: 0 })
                .eq('owner_id', session.user.id);

            if (error) throw error;

            showNotification('Todos os pontos foram zerados com sucesso!');
            fetchLeaderboard();
        } catch (err: any) {
            console.error('[LoyaltySettings] Erro ao zerar pontos:', err);
            showNotification(`Erro: ${err.message || 'Erro ao zerar pontos'}`, 'error');
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const filteredLeaderboard = leaderboard.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
            {/* Left Column: Settings */}
            <div className="xl:w-1/2 space-y-6">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 h-fit">
                    <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white relative">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Sistema de Lealdade</h3>
                            <p className="text-amber-100 opacity-90 text-sm">Configure como seus espectadores ganham pontos automaticamente.</p>
                        </div>
                        <CrownIcon className="absolute -right-10 -bottom-10 w-48 h-48 text-white opacity-10 rotate-12" />
                    </div>

                    <div className="space-y-8">
                        <section>
                            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-[#0f111a] rounded-2xl border border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-500/10 rounded-xl">
                                        <CrownIcon className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-gray-900 dark:text-white">Habilitar Sistema</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Ative o acúmulo de pontos globalmente.</p>
                                    </div>
                                </div>
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={settings.loyalty.enabled}
                                            onChange={(e) => handleLoyaltyChange('enabled', e.target.checked)}
                                        />
                                        <div className={`block w-12 h-7 rounded-full transition-colors ${settings.loyalty.enabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                        <div className={`dot absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out ${settings.loyalty.enabled ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {settings.loyalty.enabled && (
                            <section className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Pontos por Mensagem</label>
                                            <input
                                                type="number"
                                                value={settings.loyalty.pointsPerMessage}
                                                onChange={(e) => handleLoyaltyChange('pointsPerMessage', parseInt(e.target.value) || 0)}
                                                className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                                            />
                                        </div>

                                        <div className="p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Pontos por Presença</label>
                                            <input
                                                type="number"
                                                value={settings.loyalty.pointsPerInterval}
                                                onChange={(e) => handleLoyaltyChange('pointsPerInterval', parseInt(e.target.value) || 0)}
                                                className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Intervalo de Presença (Minutos)</label>
                                        <input
                                            type="number"
                                            value={settings.loyalty.intervalMinutes}
                                            onChange={(e) => handleLoyaltyChange('intervalMinutes', parseInt(e.target.value) || 1)}
                                            className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                                        />
                                    </div>

                                    <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-start gap-4">
                                        <div className="p-2 bg-white dark:bg-[#1E293B] rounded-lg shadow-sm">
                                            <SettingsIcon className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <p className="text-xs text-amber-800 dark:text-amber-200 opacity-80 leading-relaxed font-medium">
                                            Cobre pontos para ações específicas (ex: entrar na fila) na aba **Comandos do Bot**.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: User Management */}
            <div className="xl:w-1/2 flex flex-col h-[calc(100vh-180px)]">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                    <header className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#161f31] flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <UsersIcon className="w-5 h-5 text-amber-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Lista de Usuários</h3>
                            </div>
                            <button
                                onClick={fetchLeaderboard}
                                disabled={isLoading}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-500"
                                title="Atualizar Lista"
                            >
                                <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleResetAllPoints}
                                disabled={isLoading}
                                className="p-2 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-all ml-2"
                                title="Zerar Todos os Pontos"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar usuário..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-[#0F172A] dark:text-zinc-100 border border-gray-200 dark:border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                            />
                        </div>

                        <div className="mt-4 flex items-center justify-between bg-white dark:bg-[#0f111a] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Valor para ajuste manual:</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={pointsToUpdate}
                                    onChange={(e) => setPointsToUpdate(parseInt(e.target.value) || 0)}
                                    className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-bold text-center dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Add Points Manually Section */}
                        <div className="mt-4 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3">Dar Pontos para Qualquer Usuário</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Nome do usuário"
                                    value={manualUsername}
                                    onChange={(e) => setManualUsername(e.target.value)}
                                    className="flex-grow bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs font-medium dark:text-white outline-none focus:ring-1 focus:ring-amber-500/50"
                                />
                                <input
                                    type="number"
                                    placeholder="Quantia"
                                    value={manualAmount}
                                    onChange={(e) => setManualAmount(parseInt(e.target.value) || 0)}
                                    className="w-full sm:w-24 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs font-bold text-center dark:text-white outline-none focus:ring-1 focus:ring-amber-500/50"
                                />
                                <button
                                    onClick={() => handleManualPoints(manualUsername, manualAmount)}
                                    disabled={!manualUsername.trim() || isLoading}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg shadow-amber-500/20"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Notification Overlay */}
                    {notification && (
                        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300`}>
                            <div className={`px-4 py-2 rounded-full shadow-2xl border text-xs font-bold flex items-center gap-2 ${notification.type === 'success'
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'bg-red-500 border-red-400 text-white'
                                }`}>
                                {notification.type === 'success' ? <PlusIcon className="w-3 h-3" /> : <MinusIcon className="w-3 h-3" />}
                                {notification.message}
                            </div>
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-3">
                        {isLoading && filteredLeaderboard.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <RefreshCwIcon className="w-8 h-8 animate-spin opacity-20" />
                                <p className="text-sm font-medium">Carregando usuários...</p>
                            </div>
                        ) : filteredLeaderboard.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <UsersIcon className="w-12 h-12 opacity-10" />
                                <p className="text-sm font-medium">Nenhum usuário encontrado.</p>
                            </div>
                        ) : (
                            filteredLeaderboard.map((user, idx) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#161f31] rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-amber-500/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center text-amber-600 font-black text-xs border border-amber-500/10">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">{user.username}</p>
                                            <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">{user.points} Pontos</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={userPointInputs[user.username] || 0}
                                            onChange={(e) => setUserPointInputs(prev => ({
                                                ...prev,
                                                [user.username]: parseInt(e.target.value) || 0
                                            }))}
                                            placeholder="Pontos"
                                            className="w-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs font-bold text-center dark:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                        <button
                                            onClick={() => {
                                                const amount = userPointInputs[user.username] || 0;
                                                if (amount !== 0) handleManualPoints(user.username, -amount);
                                            }}
                                            disabled={!userPointInputs[user.username] || userPointInputs[user.username] === 0}
                                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Remover pontos"
                                        >
                                            <MinusIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const amount = userPointInputs[user.username] || 0;
                                                if (amount !== 0) handleManualPoints(user.username, amount);
                                            }}
                                            disabled={!userPointInputs[user.username] || userPointInputs[user.username] === 0}
                                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Adicionar pontos"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.username)}
                                            className="p-2 bg-gray-500/10 hover:bg-gray-600 text-gray-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Excluir usuário"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-[#0f111a] text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Exibindo Top 50 Colocados</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};
