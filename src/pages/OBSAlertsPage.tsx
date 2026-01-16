import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RocketIcon } from '@/components/Icons';

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [new Date().toLocaleTimeString() + ": " + msg, ...prev].slice(0, 5));
    }, []);

    const showNextAlert = useCallback((message: string, id: number) => {
        addLog("🔔 ALERTA: " + message);
        setAlert({ message, id });
        setIsVisible(true);

        // Hide after 10 seconds (increased for debugging)
        setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => setAlert(null), 500);
        }, 10000);
    }, [addLog]);

    useEffect(() => {
        if (!userId) {
            setStatus('error');
            addLog("❌ Erro: userId não encontrado");
            return;
        }

        addLog("🔌 Conectando user: " + userId);

        const channel = supabase
            .channel('bot-notifications-obs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bot_notifications'
                },
                (payload) => {
                    addLog("📥 Recebi: " + payload.new.type);
                    if (payload.new.user_id === userId && payload.new.type === 'livepix_alert') {
                        showNextAlert(payload.new.message, payload.new.id);

                        supabase
                            .from('bot_notifications')
                            .update({ read: true })
                            .eq('id', payload.new.id)
                            .then(({ error }) => {
                                if (error) addLog("⚠️ Erro read: " + error.message);
                            });
                    } else {
                        addLog("⏭️ Ignorado (ID/Tipo)");
                    }
                }
            )
            .subscribe((status) => {
                addLog("📡 Status: " + status);
                if (status === 'SUBSCRIBED') setStatus('connected');
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setStatus('error');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, showNextAlert, addLog]);

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-start pt-20 overflow-hidden font-sans relative">
            <div className={`
                transition-all duration-1000 transform
                ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90'}
                bg-gradient-to-br from-[#1E293B] to-[#0F172A]
                border-2 border-cyan-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]
                flex items-center gap-6 max-w-2xl relative
            `}>
                <div className="absolute inset-0 bg-cyan-500/10 blur-2xl rounded-full animate-pulse"></div>

                <div className="relative z-10 p-4 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
                    <RocketIcon className="w-12 h-12 text-cyan-400 animate-bounce" />
                </div>

                <div className="relative z-10">
                    <h1 className="text-cyan-400 font-black text-xl uppercase tracking-widest mb-2 flex items-center gap-2 text-shadow-glow">
                        🚀 NOVO PIX RECEBIDO 🚀
                    </h1>
                    <p className="text-white text-2xl font-bold leading-tight drop-shadow-md">
                        {alert?.message}
                    </p>
                </div>

                <div className="absolute -top-4 -right-4 w-8 h-8 bg-cyan-500/20 blur-xl animate-ping rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-500/20 blur-xl animate-ping rounded-full delay-700"></div>
            </div>
        </div>
    );
};
