import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
    const [phase, setPhase] = useState<'idle' | 'takeoff' | 'flight' | 'explosion'>('idle');
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Multiple sources for redundancy
    const audioSources = [
        "https://cdn.pixabay.com/audio/2022/03/10/audio_c8deec9833.mp3",
        "https://actions.google.com/sounds/v1/science_fiction/rocket_launch.ogg"
    ];

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

        // Robust Playback Strategy:
        // 1. Try playing through the audio element
        if (audioRef.current) {
            audioRef.current.volume = 1.0;
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Standard playback failed, attempting Web Audio API Resume...", error);
                    // 2. Fallback: try to resume AudioContext if available
                    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                        audioContextRef.current.resume();
                    }
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

    const handleInteraction = () => {
        // Unlock AudioContext (Standard way for modern browsers/OBS)
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && !audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
        }

        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Also prime the audio element
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current!.pause();
                audioRef.current!.currentTime = 0;
                setAudioUnlocked(true);
            }).catch(() => {
                setAudioUnlocked(true); // Still set as unlocked to remove the div
            });
        } else {
            setAudioUnlocked(true);
        }
    };

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
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [userId, runAlertSequence]);

    const rocketImageUrl = `${window.location.origin}/rocket_alert.png`;

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-start pt-32 overflow-hidden font-sans relative">
            {/* 
                INVISIBE INTERACTION LAYER:
                Tapping anywhere on the source in OBS (using Interact) will unlock audio.
            */}
            {!audioUnlocked && (
                <div
                    onClick={handleInteraction}
                    className="fixed inset-0 z-[9999] cursor-pointer"
                    style={{ background: 'transparent' }}
                />
            )}

            <audio ref={audioRef} preload="auto">
                <source src={audioSources[0]} type="audio/mpeg" />
                <source src={audioSources[1]} type="audio/ogg" />
            </audio>

            <div className="relative w-[1000px] h-[1000px] flex items-center justify-center">
                {/* 1st Transition: Rocket Takeoff */}
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

                {/* 2nd Part: Message Card */}
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
