import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserIcon, Gamepad2Icon, TimerIcon, UsersIcon } from '../../components/Icons';

interface QueueUser {
    username: string;
    nickname?: string;
    priority_amount?: number;
    started_at?: string;
}

export const OBSQueuePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [queue, setQueue] = useState<QueueUser[]>([]);
    const [playing, setPlaying] = useState<QueueUser[]>([]);

    const fetchAllData = async () => {
        if (!userId) return;

        // 1. Fetch Queue
        const { data: queueData } = await supabase
            .from('queue')
            .select('username, nickname, priority_amount')
            .eq('user_id', userId)
            .order('priority_amount', { ascending: false })
            .order('joined_at', { ascending: true });

        if (queueData) setQueue(queueData.map(u => ({
            username: u.username,
            nickname: u.nickname,
            priority_amount: u.priority_amount ? Number(u.priority_amount) : 0
        })));

        // 2. Fetch Playing
        const { data: playingData } = await supabase
            .from('playing_users')
            .select('username, nickname')
            .eq('user_id', userId);

        if (playingData) setPlaying(playingData.map(u => ({
            username: u.username,
            nickname: u.nickname
        })));
    };

    useEffect(() => {
        if (!userId) return;
        fetchAllData();

        const channel = supabase.channel('obs-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue', filter: `user_id=eq.${userId}` }, fetchAllData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'playing_users', filter: `user_id=eq.${userId}` }, fetchAllData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    useEffect(() => {
        document.body.classList.add('bg-transparent-important');
        document.documentElement.classList.add('bg-transparent-important');
    }, []);

    return (
        <div className="w-full h-screen bg-transparent p-10 font-sans flex flex-col gap-10 overflow-hidden">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lime-500 rounded-lg shadow-[0_0_20px_rgba(132,204,22,0.5)]">
                        <Gamepad2Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">Jogando Agora</h2>
                </div>

                <div className="flex flex-wrap gap-4">
                    {playing.map(p => (
                        <div key={p.username} className="flex flex-col bg-slate-900/80 backdrop-blur-md border-2 border-lime-500/50 rounded-2xl p-4 min-w-[240px] shadow-2xl animate-fadeIn">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                                    <UserIcon className="w-5 h-5 text-lime-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold truncate leading-tight">{p.username}</p>
                                    <p className="text-lime-400/80 text-[10px] font-black uppercase tracking-tighter truncate">{p.nickname || 'Player'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {playing.length === 0 && (
                        <p className="text-white/20 font-black uppercase tracking-widest text-sm italic">Aguardando jogadores...</p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 max-w-[400px]">
                <div className="flex items-center justify-between gap-4 pr-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                            <UsersIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">Fila de Espera</h2>
                    </div>
                    <button
                        onClick={fetchAllData}
                        className="p-2 bg-slate-800/30 hover:bg-cyan-500/20 rounded-lg text-white/30 hover:text-cyan-400 transition-all active:scale-95"
                        title="Atualizar Fila"
                    >
                        <RefreshCwIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {queue.length > 0 ? (
                        queue.map((u, index) => (
                            <div key={u.username} className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-sm border border-white/10 p-3 rounded-xl shadow-lg animate-slideRight" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-xs">
                                    #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{u.username}</p>
                                    <div className="flex items-center gap-2">
                                        {u.nickname && <p className="text-cyan-400/60 text-[9px] font-bold truncate uppercase">{u.nickname}</p>}
                                        {u.priority_amount ? (
                                            <span className="text-[8px] font-black bg-amber-500/20 text-amber-500 px-1 rounded border border-amber-500/30">
                                                IDOSA / VIP
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/20 font-black uppercase tracking-widest text-xs">Fila vazia. Digite !entrar no chat!</p>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
                .animate-slideRight { animation: slideRight 0.3s ease-out forwards; }
            `}} />
        </div>
    );
};
