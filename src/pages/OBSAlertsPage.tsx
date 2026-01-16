import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
    const [phase, setPhase] = useState<'idle' | 'takeoff' | 'flight' | 'explosion'>('idle');
    const [audioTestStatus, setAudioTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [audioPrimed, setAudioPrimed] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Audio source - switching to a more reliable rocket sound
    const audioUrl = "https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptoken=6697a8e2-c081-4389-8b01-38dc1a007304";

    const triggerExplosion = () => {
        const count = 300;
        const defaults = { origin: { y: 0.4 } };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 40, startVelocity: 60 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 1.1 });
        fire(0.1, { spread: 140, startVelocity: 35, decay: 0.92, scalar: 1.6 });
    };

    const runAlertSequence = useCallback((message: string, id: number) => {
        setAlert({ message, id });
        setPhase('takeoff');

        // Sound: Liftoff
        if (audioRef.current) {
            audioRef.current.dispatchEvent(new Event('play')); // Some environments respond better to events
            audioRef.current.volume = 1.0;
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                });
            }
        }

        setTimeout(() => {
            setPhase('flight');
            setTimeout(() => {
                setPhase('explosion');
                triggerExplosion();

                setTimeout(() => {
                    setPhase('idle');
                    setAlert(null);
                }, 10000);
            }, 900);
        }, 2000);
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
                setAudioPrimed(true);
            });
        }
    };

    const testAudio = () => {
        setAudioTestStatus('testing');
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play()
                .then(() => setAudioTestStatus('success'))
                .catch(() => setAudioTestStatus('error'));
        } else {
            setAudioTestStatus('error');
        }
    };

    const rocketImageUrl = `${window.location.origin}/rocket_alert.png`;

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-start pt-32 overflow-hidden font-sans relative">
            {/* Audio Interaction Overlay */}
            {!audioPrimed && phase === 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-6 p-10 bg-gray-900 border-4 border-cyan-500 rounded-[3rem] shadow-[0_0_50px_rgba(6,182,212,0.4)]">
                        <button
                            onClick={handlePrimeAudio}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-5 rounded-3xl text-2xl font-black shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse border-2 border-white/20 uppercase tracking-widest"
                        >
                            🔊 CLIQUE PARA ATIVAR O ALERTA
                        </button>

                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={testAudio}
                                className="text-cyan-400 text-sm font-bold hover:text-white transition-colors"
                            >
                                {audioTestStatus === 'idle' && "🔧 Testar Som agora (Diagnóstico)"}
                                {audioTestStatus === 'testing' && "⌛ Testando..."}
                                {audioTestStatus === 'success' && "✅ Som Funcionando!"}
                                {audioTestStatus === 'error' && "❌ Erro no Som! (Verifique Saída de Áudio do OBS)"}
                            </button>
                            <span className="text-gray-500 text-[10px] max-w-xs text-center">
                                * No OBS, use "Interagir" para clicar. Certifique-se que "Controlar áudio via OBS" está marcado.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <audio
                ref={audioRef}
                src={audioUrl}
                preload="auto"
            />

            <div className="relative w-[1000px] h-[1000px] flex items-center justify-center">
                {/* 1st Transition: Rocket Takeoff (ALWAYS kept as user loved it) */}
                {(phase === 'takeoff' || phase === 'flight') && (
                    <div className={`
                        absolute bottom-0 w-80 h-auto transition-all duration-[1200ms] ease-in
                        ${phase === 'takeoff' ? 'animate-shake' : ''}
                        ${phase === 'flight' ? '-translate-y-[1500px] opacity-100 scale-125' : ''}
                    `}>
                        <img src={rocketImageUrl} className="w-full h-auto drop-shadow-[0_0_50px_rgba(255,100,0,0.8)]" alt="rocket" />
                        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-12 h-60 bg-gradient-to-t from-orange-600 via-orange-400 to-yellow-200 blur-2xl animate-pulse rounded-full opacity-90"></div>
                    </div>
                )}

                {/* 2nd Part: Message Card (Refined: No extra icon as requested) */}
                <div style={{
                    backgroundColor: '#0f172a',
                    backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
                    border: '6px solid #06b6d4',
                    borderRadius: '3rem',
                    padding: '4rem 6rem',
                    boxShadow: '0 0 120px rgba(6, 182, 212, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '2.5rem',
                    transition: 'all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: phase === 'explosion' ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(-60px)',
                    opacity: phase === 'explosion' ? 1 : 0,
                    maxWidth: '900px',
                    position: 'relative',
                    zIndex: 50
                }}>
                    {/* User requested to remove the icon from here */}

                    <div className="space-y-6">
                        <h1 style={{ color: '#22d3ee', fontWeight: 900, fontSize: '3.5rem', textTransform: 'uppercase', letterSpacing: '0.4em', textShadow: '0 0 20px rgba(34, 211, 238, 0.7)' }}>
                            🚀 COMPROU FILA! 🚀
                        </h1>
                        <div style={{ height: '0.6rem', width: '100%', background: 'linear-gradient(to right, transparent, #06b6d4, transparent)', opacity: 0.6 }}></div>
                    </div>

                    <p style={{ color: 'white', fontWeight: 900, fontSize: '4.5rem', lineHeight: 1.1, textShadow: '0 4px 25px rgba(0,0,0,1)' }}>
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
            `}} />
        </div>
    );
};
