import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
    const [phase, setPhase] = useState<'idle' | 'takeoff' | 'flight' | 'explosion'>('idle');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const triggerExplosion = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.3 }
        };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const runAlertSequence = useCallback((message: string, id: number) => {
        setAlert({ message, id });
        setPhase('takeoff');

        // Sound: Liftoff
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play error:", e));
        }

        // Timeline:
        // 1. Shake it (takeoff) - 1.5s
        // 2. Flight up - 1s
        // 3. Explosion

        setTimeout(() => {
            setPhase('flight');
            setTimeout(() => {
                setPhase('explosion');
                triggerExplosion();

                // Reset after total 10s
                setTimeout(() => {
                    setPhase('idle');
                    setAlert(null);
                }, 8000);
            }, 800);
        }, 1500);
    }, []);

    useEffect(() => {
        if (!userId) return;

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
                    if (payload.new.user_id === userId && payload.new.type === 'livepix_alert') {
                        runAlertSequence(payload.new.message, payload.new.id);

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
    }, [userId, runAlertSequence]);

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-start pt-32 overflow-hidden font-sans relative">
            {/* Audio Element: Liftoff Sound */}
            <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2022/03/10/audio_c8deec9833.mp3" preload="auto" />

            <div className="relative w-[600px] h-[600px] flex items-center justify-center">
                {/* Rocket Animation */}
                {phase !== 'idle' && phase !== 'explosion' && (
                    <div className={`
                        absolute bottom-0 w-32 h-auto transition-all duration-[1000ms] ease-in
                        ${phase === 'takeoff' ? 'animate-shake' : ''}
                        ${phase === 'flight' ? '-translate-y-[800px] opacity-100' : ''}
                    `}>
                        <img src="/rocket_alert.png" className="w-full h-auto drop-shadow-[0_0_15px_rgba(255,100,0,0.5)]" alt="rocket" />

                        {/* Exhaust flame effect */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4 h-20 bg-gradient-to-t from-orange-500 to-yellow-300 blur-md animate-pulse rounded-full opacity-80"></div>
                    </div>
                )}

                {/* Explosion Message Card */}
                <div className={`
                    bg-gradient-to-br from-[#1E293B]/95 to-[#0F172A]/95
                    border-4 border-cyan-500 rounded-[2rem] p-10 shadow-[0_0_80px_rgba(6,182,212,0.5)]
                    flex flex-col items-center text-center gap-4 transition-all duration-700 transform
                    ${phase === 'explosion' ? 'scale-100 opacity-100 translate-y-0 text-glow' : 'scale-50 opacity-0 -translate-y-20'}
                `}>
                    <div className="p-5 bg-cyan-500/20 rounded-full border-2 border-cyan-500/30 animate-pulse">
                        <img src="/rocket_alert.png" className="w-16 h-16" alt="icon" />
                    </div>

                    <h1 className="text-cyan-400 font-black text-3xl uppercase tracking-[0.2em] animate-bounce">
                        💨 COMPROU FILA! 💨
                    </h1>

                    <p className="text-white text-4xl font-extrabold leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] max-w-lg">
                        {alert?.message}
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .animate-shake {
                    animation: shake 0.1s infinite;
                }
                .text-glow {
                    text-shadow: 0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(6, 182, 212, 0.4);
                }
            `}} />
        </div>
    );
};
