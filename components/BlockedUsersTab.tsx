import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/src/contexts/SessionContext';
import { ShieldIcon, SearchIcon, TrashIcon, RefreshCwIcon, PlusIcon, UsersIcon, EditIcon } from './Icons';

export const BlockedUsersTab: React.FC = () => {
    const { session } = useSession();
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newChannelId, setNewChannelId] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newReason, setNewReason] = useState('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchBlockedUsers = useCallback(async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('blocked_users')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBlockedUsers(data || []);
        } catch (err) {
            console.error('Error fetching blocked users:', err);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const handleBlockUser = async () => {
        if (!session?.user?.id || !newChannelId.trim()) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('blocked_users')
                .insert({
                    user_id: session.user.id,
                    youtube_channel_id: newChannelId.trim(),
                    username: newUsername.trim() || null,
                    reason: newReason.trim() || null
                });

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Este usuário já está bloqueado.');
                }
                throw error;
            }

            showNotification('Usuário bloqueado com sucesso!');
            setNewChannelId('');
            setNewUsername('');
            setNewReason('');
            fetchBlockedUsers();
            window.dispatchEvent(new CustomEvent('blockedUsersChanged'));
        } catch (err: any) {
            console.error('Error blocking user:', err);
            showNotification(err.message || 'Erro ao bloquear usuário', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditReason = async (channelId: string, currentReason: string) => {
        if (!session?.user?.id) return;

        const newReasonPrompt = window.prompt("Digite o novo motivo do bloqueio:", currentReason || "");
        if (newReasonPrompt === null) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('blocked_users')
                .update({ reason: newReasonPrompt.trim() || null })
                .eq('youtube_channel_id', channelId)
                .eq('user_id', session.user.id);

            if (error) throw error;

            showNotification('Motivo atualizado com sucesso!');
            fetchBlockedUsers();
        } catch (err: any) {
            console.error('Error updating reason:', err);
            showNotification('Erro ao atualizar motivo', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnblockUser = async (channelId: string) => {
        if (!session?.user?.id) return;

        const confirmed = window.confirm(`Deseja desbloquear este usuário? Ele poderá usar comandos novamente.`);
        if (!confirmed) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('blocked_users')
                .delete()
                .eq('youtube_channel_id', channelId)
                .eq('user_id', session.user.id);

            if (error) throw error;

            showNotification('Usuário desbloqueado!');
            fetchBlockedUsers();
            window.dispatchEvent(new CustomEvent('blockedUsersChanged'));
        } catch (err: any) {
            console.error('Error unblocking user:', err);
            showNotification('Erro ao desbloquear usuário', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = blockedUsers.filter(user =>
        (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        user.youtube_channel_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
            {/* Left Column: Add User */}
            <div className="xl:w-1/3 space-y-6">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 h-fit">
                    <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-rose-700 p-8 text-white relative">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Bloquear Usuário</h3>
                            <p className="text-red-100 opacity-90 text-sm">Impedir que um usuário use comandos do bot.</p>
                        </div>
                        <ShieldIcon className="absolute -right-10 -bottom-10 w-48 h-48 text-white opacity-10 rotate-12" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">ID do Canal do YouTube</label>
                            <input
                                type="text"
                                placeholder="Ex: UC..."
                                value={newChannelId}
                                onChange={(e) => setNewChannelId(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Nome de Exibição (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Nome para identificar o usuário"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Motivo do Bloqueio (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Por que este usuário foi bloqueado?"
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <button
                            onClick={handleBlockUser}
                            disabled={!newChannelId.trim() || isLoading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {isLoading ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <ShieldIcon className="w-5 h-5" />}
                            Bloquear Usuário
                        </button>
                    </div>

                    <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                        <h4 className="font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2 text-sm">
                            <ShieldIcon className="w-4 h-4" />
                            Como funciona?
                        </h4>
                        <p className="text-xs text-red-800 dark:text-red-200 opacity-80 leading-relaxed">
                            Usuários bloqueados ainda podem ver a fila e interagir no chat, mas o bot **ignorará completamente** qualquer comando vindo deles.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: List */}
            <div className="xl:w-2/3 flex flex-col h-[calc(100vh-180px)]">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                    <header className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#161f31] flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldIcon className="w-5 h-5 text-red-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Usuários Bloqueados</h3>
                            </div>
                            <button
                                onClick={fetchBlockedUsers}
                                disabled={isLoading}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-500"
                            >
                                <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar nos bloqueados..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-[#0F172A] dark:text-zinc-100 border border-gray-200 dark:border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium"
                            />
                        </div>
                    </header>

                    {/* Notification Overlay */}
                    {notification && (
                        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300`}>
                            <div className={`px-4 py-2 rounded-full shadow-2xl border text-xs font-bold flex items-center gap-2 ${notification.type === 'success'
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'bg-red-500 border-red-400 text-white'
                                }`}>
                                <PlusIcon className="w-3 h-3" />
                                {notification.message}
                            </div>
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-3">
                        {isLoading && filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <RefreshCwIcon className="w-8 h-8 animate-spin opacity-20" />
                                <p className="text-sm font-medium">Carregando lista...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <UsersIcon className="w-12 h-12 opacity-10" />
                                <p className="text-sm font-medium">Nenhum usuário bloqueado.</p>
                                <p className="text-xs text-center px-8">Use o formulário ao lado para adicionar usuários pelo ID do canal do YouTube.</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#161f31] rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-red-500/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/10">
                                            <ShieldIcon className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate">
                                                {user.username || 'Usuário Sem Nome'}
                                            </p>
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase tracking-tight truncate">
                                                    ID: {user.youtube_channel_id}
                                                </p>
                                                {user.reason && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 italic truncate max-w-[200px] xl:max-w-[300px]" title={user.reason}>
                                                        Motivo: {user.reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditReason(user.youtube_channel_id, user.reason)}
                                            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 hover:text-white rounded-xl transition-all text-gray-500"
                                            title="Editar Motivo"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleUnblockUser(user.youtube_channel_id)}
                                            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-500 hover:text-white rounded-xl transition-all text-gray-500"
                                            title="Desbloquear usuário"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-[#0f111a] text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Bloqueios por ID de Canal de Transmissão</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};
