import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserIcon, Gamepad2Icon, TimerIcon, UsersIcon } from '../../components/Icons';

interface QueueUser {
    username: string;
    nickname?: string;
    started_at?: string;
}

export const OBSQueuePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [queue, setQueue] = useState<QueueUser[]>([]);
    const [playing, setPlaying] = useState<QueueUser[]>([]);
    const [timeoutMinutes, setTimeoutMinutes] = useState(5);
    const [timeoutSeconds, setTimeoutSeconds] = useState(0);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Sync Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAllData = async () => {
        if (!userId) return;

        // 1. Fetch Settings (for timeout)
        const { data: settingsData } = await supabase
            .from('app_settings')
            .select('settings')
            .eq('user_id', userId)
            .maybeSingle();

        if (settingsData?.settings) {
            setTimeoutMinutes(settingsData.settings.playingTimeoutMinutes ?? 5);
            setTimeoutSeconds(settingsData.settings.playingTimeoutSeconds ?? 0);
        }

        // 2. Fetch Queue
        const { data: queueData } = await supabase
            .from('queue')
            .select('username, nickname')
            .eq('user_id', userId)
            .order('joined_at', { ascending: true });

        if (queueData) setQueue(queueData.map(u => ({ username: u.username, nickname: u.nickname })));

        // 3. Fetch Playing
        const { data: playingData } = await supabase
            .from('playing_users')
            .select('username, nickname, started_at')
            .eq('user_id', userId)
            .order('started_at', { ascending: true });

        if (playingData) setPlaying(playingData.map(u => ({
            username: u.username,
            nickname: u.nickname,
            started_at: u.started_at
        })));
    };

    useEffect(() => {
        if (!userId) return;
        fetchAllData();

        // Subscribe to changes
        const queueChannel = supabase.channel('obs-queue-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue', filter: `user_id=eq.${userId}` }, () => fetchAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'playing_users', filter: `user_id=eq.${userId}` }, () => fetchAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: `user_id=eq.${userId}` }, () => fetchAllData())
            .subscribe();

        return () => {
            supabase.removeChannel(queueChannel);
        };
    }, [userId]);

    const getRemainingTime = (startedAt?: string) => {
        if (!startedAt) return null;
        const start = new Date(startedAt).getTime();
        const limit = (timeoutMinutes * 60 + timeoutSeconds) * 1000;
        const elapsed = currentTime - start;
        const remaining = Math.max(0, limit - elapsed);

        const totalRemainingSecs = Math.floor(remaining / 1000);
        const mins = Math.floor(totalRemainingSecs / 60);
        const secs = totalRemainingSecs % 60;

        return {
            text: `${mins}:${secs.toString().padStart(2, '0')}`,
            isExpired: remaining === 0,
            remainingMs: remaining
        };
    };

    // Force transparent background
    useEffect(() => {
        const root = document.getElementById('root');
        document.body.classList.add('bg-transparent-important');
        document.documentElement.classList.add('bg-transparent-important');
        if (root) root.classList.add('bg-transparent-important');
    }, []);

    return (
        <div className="w-full h-screen bg-transparent p-10 font-sans flex flex-col gap-10 overflow-hidden">
            {/* 1. SECTION: JOGANDO AGORA (Visible only if someone is playing & not expired) */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lime-500 rounded-lg shadow-[0_0_20px_rgba(132,204,22,0.5)]">
                        <Gamepad2Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">Jogando Agora</h2>
                </div>

                <div className="flex flex-wrap gap-4">
                    {playing.map(p => {
                        const timer = getRemainingTime(p.started_at);
                        if (timer?.isExpired) return null; // Hide if expired per user request

                        return (
                            <div key={p.username} className="flex flex-col bg-slate-900/80 backdrop-blur-md border-2 border-lime-500/50 rounded-2xl p-4 min-w-[240px] shadow-2xl animate-fadeIn">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                                        <UserIcon className="w-5 h-5 text-lime-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold truncate leading-tight">{p.username}</p>
                                        <p className="text-lime-400/80 text-[10px] font-black uppercase tracking-tighter truncate">{p.nickname || 'Player'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 bg-lime-500/20 py-1.5 rounded-xl border border-lime-500/30">
                                    <TimerIcon className="w-4 h-4 text-lime-400 animate-pulse" />
                                    <span className="text-lime-400 font-mono font-black text-xl tracking-tighter">{timer?.text}</span>
                                </div>
                            </div>
                        );
                    })}
                    {playing.filter(p => !getRemainingTime(p.started_at)?.isExpired).length === 0 && (
                        <p className="text-white/20 font-black uppercase tracking-widest text-sm italic">Aguardando jogadores...</p>
                    )}
                </div>
            </div>

            {/* 2. SECTION: FILA DE ESPERA */}
            <div className="flex flex-col gap-4 max-w-[400px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                        <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">Fila de Espera</h2>
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
                                    {u.nickname && <p className="text-cyan-400/60 text-[9px] font-bold truncate uppercase">{u.nickname}</p>}
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
