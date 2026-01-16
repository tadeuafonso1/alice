import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
    const [phase, setPhase] = useState<'idle' | 'takeoff' | 'flight' | 'explosion'>('idle');
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // SYNTHESIZED ROCKET SOUND (The Nuclear Option)
    // This generates noise locally using the Web Audio API. 
    // It works even if MP3 files are blocked or broken.
    const playSynthesizedRocket = useCallback(() => {
        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContextClass();
            }

            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            // Generate Brown Noise (deeper than white noise, sounds like an engine)
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // Louder
            }

            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;

            // Lowpass filter to sweep the "rumble"
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 3);
            filter.Q.value = 1;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.5); // Fade in
            gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 2.5); // Sustain
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.5); // Fade out

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start();
            noise.stop(ctx.currentTime + 4);
        } catch (e) {
            console.error("Rocket synthesizer failed:", e);
        }
    }, []);

    // SYNTHESIZED EXPLOSION SOUND
    const playSynthesizedExplosion = useCallback(() => {
        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass || !audioContextRef.current) return;

            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const bufferSize = 1 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1; // White noise
            }

            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01); // Instant peak
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0); // Natural decay

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start();
            noise.stop(ctx.currentTime + 1);
        } catch (e) {
            console.error("Explosion synthesizer failed:", e);
        }
    }, []);

    const triggerExplosion = () => {
        const count = 300;
        const defaults = { origin: { y: 0.4 } };
        function fire(particleRatio: number, opts: any) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 40, startVelocity: 60 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 1.1 });
        fire(0.1, { spread: 140, startVelocity: 35, decay: 0.92, scalar: 1.6 });
    };

    const runAlertSequence = useCallback((message: string, id: number) => {
        setAlert({ message, id });
        setPhase('takeoff');

        // Play the synthesized sound
        playSynthesizedRocket();

        setTimeout(() => {
            setPhase('flight');
            setTimeout(() => {
                setPhase('explosion');
                triggerExplosion();
                playSynthesizedExplosion(); // Trigger the synth explosion

                setTimeout(() => {
                    setPhase('idle');
                    setAlert(null);
                }, 10000);
            }, 900);
        }, 2000);
    }, [playSynthesizedRocket]);

    const handleInteraction = () => {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && !audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Play a tiny confirmation blip
        if (audioContextRef.current) {
            const osc = audioContextRef.current.createOscillator();
            const g = audioContextRef.current.createGain();
            osc.connect(g);
            g.connect(audioContextRef.current.destination);
            g.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.1);
            osc.start();
            osc.stop(audioContextRef.current.currentTime + 0.1);
        }

        setAudioUnlocked(true);
    };

    useEffect(() => {
        if (!userId) return;
        const channel = supabase.channel('bot-notifications-obs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bot_notifications' }, (payload) => {
                if (payload.new.user_id === userId && payload.new.type === 'livepix_alert') {
                    runAlertSequence(payload.new.message, payload.new.id);
                    supabase.from('bot_notifications').update({ read: true }).eq('id', payload.new.id).then();
                }
            }).subscribe();
        return () => { supabase.removeChannel(channel); if (audioContextRef.current) audioContextRef.current.close(); };
    }, [userId, runAlertSequence]);

    const rocketImageUrl = `${window.location.origin}/rocket_alert.png`;

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-start pt-32 overflow-hidden font-sans relative">
            {/* SUBTLE ACTIVATION BUTTON */}
            {!audioUnlocked ? (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-4">
                    <button
                        onClick={handleInteraction}
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/30 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm transition-all animate-pulse"
                    >
                        🔈 Ativar Alerta (Clique aqui no "Interagir" do OBS)
                    </button>
                    <span className="text-cyan-900/40 text-[10px] uppercase font-black">Áudio via Web Audio API (Nuclear Mode)</span>
                </div>
            ) : (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 text-cyan-500/30 text-[10px] font-bold animate-fade-out">
                    ✅ ÁUDIO PRONTO
                </div>
            )}

            <div className="relative w-[1000px] h-[1000px] flex items-center justify-center">
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

                <div style={{
                    backgroundColor: '#0f172a',
                    backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
                    border: '6px solid #06b6d4',
                    borderRadius: '3rem',
                    padding: '4rem 6rem',
                    boxShadow: '0 0 120px rgba(6, 182, 212, 0.7)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2.5rem',
                    transition: 'all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: phase === 'explosion' ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(-60px)',
                    opacity: phase === 'explosion' ? 1 : 0,
                    maxWidth: '900px', position: 'relative', zIndex: 50
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
                .animate-shake { animation: shake 0.08s infinite; }
                .animate-fade-out { animation: fadeOut 2s forwards; }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
            `}} />
        </div>
    );
};
