import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
    const [phase, setPhase] = useState<'idle' | 'takeoff' | 'flight' | 'explosion'>('idle');
    const [audioPrimed, setAudioPrimed] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const triggerExplosion = () => {
        const count = 250;
        const defaults = { origin: { y: 0.4 } };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 30, startVelocity: 60 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 1.0 });
        fire(0.1, { spread: 130, startVelocity: 30, decay: 0.92, scalar: 1.5 });
        fire(0.1, { spread: 130, startVelocity: 50 });
    };

    const runAlertSequence = useCallback((message: string, id: number) => {
        setAlert({ message, id });
        setPhase('takeoff');

        // Sound: Liftoff
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
                console.warn("Autoplay blocked or audio error. User interaction required.", e);
            });
        }

        setTimeout(() => {
            setPhase('flight');
            setTimeout(() => {
                setPhase('explosion');
                triggerExplosion();

                setTimeout(() => {
                    setPhase('idle');
                    setAlert(null);
                }, 9000);
            }, 800);
        }, 1800); // Slightly longer takeoff shake
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

    const handlePrimeAudio = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current!.pause();
                audioRef.current!.currentTime = 0;
                setAudioPrimed(true);
            }).catch(() => {
                setAudioPrimed(false);
            });
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-start pt-32 overflow-hidden font-sans relative">
            {/* Audio Priming Overlay (Only visible in browser/testing, normally clicked once by user) */}
            {!audioPrimed && phase === 'idle' && (
                <button
                    onClick={handlePrimeAudio}
                    className="fixed bottom-4 right-4 bg-cyan-600/80 hover:bg-cyan-500 text-white px-6 py-3 rounded-full text-sm font-bold animate-pulse backdrop-blur-md border border-white/20 z-[100] shadow-2xl"
                >
                    🔊 ATIVAR ÁUDIO (Clique aqui uma vez)
                </button>
            )}

            {/* Audio Element: Liftoff Sound - Using a more stable URL */}
            <audio
                ref={audioRef}
                src="https://assets.mixkit.co/sfx/preview/mixkit-rocket-shuttle-launch-2144.mp3"
                preload="auto"
            />

            <div className="relative w-[1000px] h-[1000px] flex items-center justify-center">
                {/* Rocket Animation */}
                {phase !== 'idle' && phase !== 'explosion' && (
                    <div className={`
                        absolute bottom-0 w-80 h-auto transition-all duration-[1200ms] ease-in
                        ${phase === 'takeoff' ? 'animate-shake' : ''}
                        ${phase === 'flight' ? '-translate-y-[1500px] opacity-100 scale-125' : ''}
                    `}>
                        <img src="/rocket_alert.png" className="w-full h-auto drop-shadow-[0_0_50px_rgba(255,100,0,0.8)]" alt="rocket" />

                        {/* Enlarged Exhaust flame effect */}
                        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-12 h-60 bg-gradient-to-t from-orange-600 via-orange-400 to-yellow-200 blur-2xl animate-pulse rounded-full opacity-90"></div>
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-8 h-30 bg-white blur-xl animate-pulse rounded-full opacity-100"></div>
                    </div>
                )}

                {/* Explosion Message Card */}
                <div className={`
                    bg-gradient-to-br from-[#1E293B]/98 to-[#020617]/98
                    border-[6px] border-cyan-500 rounded-[3rem] p-12 shadow-[0_0_120px_rgba(6,182,212,0.7)]
                    flex flex-col items-center text-center gap-8 transition-all duration-700 transform
                    ${phase === 'explosion' ? 'scale-100 opacity-100 translate-y-0 text-glow' : 'scale-50 opacity-0 -translate-y-60'}
                    relative z-50
                `}>
                    <div className="p-10 bg-cyan-500/20 rounded-full border-4 border-cyan-500/30 animate-pulse shadow-[0_0_60px_rgba(6,182,212,0.4)]">
                        <img src="/rocket_alert.png" className="w-48 h-48 object-contain" alt="icon" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-cyan-400 font-black text-5xl uppercase tracking-[0.4em] animate-bounce filter drop-shadow-[0_0_20px_rgba(34,211,238,0.7)]">
                            🚀 COMPROU FILA! 🚀
                        </h1>
                        <div className="h-2 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60"></div>
                    </div>

                    <p className="text-white text-6xl font-black leading-tight drop-shadow-[0_4px_25px_rgba(0,0,0,1)] max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                        {alert?.message}
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0% { transform: translate(3px, 3px) rotate(0deg); }
                    10% { transform: translate(-3px, -4px) rotate(-2deg); }
                    20% { transform: translate(-5px, 0px) rotate(2deg); }
                    30% { transform: translate(5px, 4px) rotate(0deg); }
                    40% { transform: translate(3px, -3px) rotate(2deg); }
                    50% { transform: translate(-3px, 4px) rotate(-2deg); }
                    60% { transform: translate(-5px, 3px) rotate(0deg); }
                    70% { transform: translate(5px, 3px) rotate(-2deg); }
                    80% { transform: translate(-3px, -3px) rotate(2deg); }
                    90% { transform: translate(3px, 4px) rotate(0deg); }
                    100% { transform: translate(3px, -4px) rotate(-2deg); }
                }
                .animate-shake {
                    animation: shake 0.08s infinite;
                }
                .text-glow {
                    text-shadow: 0 0 40px rgba(6, 182, 212, 1), 0 0 80px rgba(6, 182, 212, 0.6);
                }
            `}} />
        </div>
    );
};
