import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RocketIcon } from '@/components/Icons';

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showNextAlert = useCallback((message: string, id: number) => {
        setAlert({ message, id });
        setIsVisible(true);

        // Hide after 8 seconds
        setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => setAlert(null), 500); // Clear after fade out
        }, 8000);
    }, []);

    useEffect(() => {
        if (!userId) return;

        // Subscribe to real-time changes in bot_notifications
        const channel = supabase
            .channel('bot-notifications-obs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bot_notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.new.type === 'livepix_alert') {
                        showNextAlert(payload.new.message, payload.new.id);

                        // Mark as read in background
                        supabase
                            .from('bot_notifications')
                            .update({ read: true })
                            .eq('id', payload.new.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, showNextAlert]);

    if (!alert) return <div className="min-h-screen bg-transparent"></div>;

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-start pt-20 overflow-hidden font-sans">
            <div className={`
                transition-all duration-1000 transform
                ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90'}
                bg-gradient-to-br from-[#1E293B] to-[#0F172A]
                border-2 border-cyan-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]
                flex items-center gap-6 max-w-2xl relative
            `}>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-cyan-500/10 blur-2xl rounded-full animate-pulse"></div>

                <div className="relative z-10 p-4 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
                    <RocketIcon className="w-12 h-12 text-cyan-400 animate-bounce" />
                </div>

                <div className="relative z-10">
                    <h1 className="text-cyan-400 font-black text-xl uppercase tracking-widest mb-2 flex items-center gap-2">
                        🚀 NOVO PIX RECEBIDO 🚀
                    </h1>
                    <p className="text-white text-2xl font-bold leading-tight drop-shadow-md">
                        {alert.message}
                    </p>
                </div>

                {/* Particle effect simulation */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-cyan-500/20 blur-xl animate-ping rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-500/20 blur-xl animate-ping rounded-full delay-700"></div>
            </div>
        </div>
    );
};
