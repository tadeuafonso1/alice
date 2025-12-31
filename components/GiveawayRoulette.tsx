import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GiftIcon, RefreshCwIcon, TrophyIcon, UsersIcon, TimerIcon, TrashIcon } from './Icons';
import confetti from 'canvas-confetti';

interface GiveawayRouletteProps {
    activeChatters: Record<string, number>;
    externalParticipants?: string[];
    onClearExternalParticipants?: () => void;
    onRemoveExternalParticipant?: (name: string) => void;
}

export const GiveawayRoulette: React.FC<GiveawayRouletteProps> = ({
    activeChatters,
    externalParticipants = [],
    onClearExternalParticipants,
    onRemoveExternalParticipant
}) => {
    const [participants, setParticipants] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);

    // Persistence: Load from localStorage
    useEffect(() => {
        // Expose for debugging
        (window as any).fireConfetti = () => {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
        };

        const saved = localStorage.getItem('alice_giveaway_participants');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setParticipants(parsed);
            } catch (e) { console.error('Error loading giveaway participants', e); }
        }

        const savedWinner = localStorage.getItem('alice_giveaway_winner');
        if (savedWinner) setWinner(savedWinner);

        const savedAngle = localStorage.getItem('alice_giveaway_angle');
        if (savedAngle) spinAngleRef.current = parseFloat(savedAngle);
    }, []);

    // Persistence: Save to localStorage
    useEffect(() => {
        localStorage.setItem('alice_giveaway_participants', JSON.stringify(participants));
    }, [participants]);

    useEffect(() => {
        localStorage.setItem('alice_giveaway_angle', spinAngleRef.current.toString());
    }, [isSpinning]); // Save after spin ends or starts

    useEffect(() => {
        if (winner) {
            localStorage.setItem('alice_giveaway_winner', winner);
        } else {
            localStorage.removeItem('alice_giveaway_winner');
        }
    }, [winner]);

    // Auto-import external participants (!participar command)
    useEffect(() => {
        if (externalParticipants.length > 0) {
            setParticipants(prev => {
                const combined = Array.from(new Set([...prev, ...externalParticipants])).slice(0, 100);
                return combined;
            });
        }
    }, [externalParticipants]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spinAngleRef = useRef(0);
    const lastTickAngleRef = useRef(0);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Initialize Audio Context on demand
    const getAudioCtx = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    const playTickSound = useCallback(() => {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }, []);

    const playWinSound = useCallback(() => {
        const ctx = getAudioCtx();
        const playNote = (freq: number, time: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
            gain.gain.setValueAtTime(0.05, ctx.currentTime + time);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + time);
            osc.stop(ctx.currentTime + time + duration);
        };

        playNote(523.25, 0, 0.1); // C5
        playNote(659.25, 0.1, 0.1); // E5
        playNote(783.99, 0.2, 0.3); // G5
    }, []);

    const colors = ['#3ABEF9', '#F9C80E', '#F87060', '#A1E887', '#9D4EDD', '#F15BB5'];

    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (participants.length === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Adicione participantes', centerX, centerY);
            return;
        }

        const arc = (Math.PI * 2) / participants.length;

        participants.forEach((name, i) => {
            const angle = spinAngleRef.current + i * arc;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, angle, angle + arc);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + arc / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Inter';
            ctx.textAlign = 'right';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(name, radius - 20, 5);
            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }, [participants]);

    useEffect(() => {
        drawWheel();
    }, [drawWheel]);

    const handleSpin = () => {
        if (isSpinning || participants.length < 2) return;

        setIsSpinning(true);
        setWinner(null);

        const spinDuration = 5000;
        const startTimestamp = performance.now();
        const startAngle = spinAngleRef.current;
        const totalRotation = Math.PI * 2 * 10 + Math.random() * Math.PI * 2;

        const animate = (now: number) => {
            const elapsed = now - startTimestamp;
            const progress = Math.min(elapsed / spinDuration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            spinAngleRef.current = startAngle + totalRotation * easeOut;

            // Simple tick sound when crossing a segment
            const arc = (Math.PI * 2) / participants.length;
            const currentAngle = spinAngleRef.current;
            if (Math.floor(currentAngle / arc) !== Math.floor(lastTickAngleRef.current / arc)) {
                playTickSound();
            }
            lastTickAngleRef.current = currentAngle;

            drawWheel();

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);

                // Calculate winner
                const finalAngle = spinAngleRef.current % (Math.PI * 2);
                const arc = (Math.PI * 2) / participants.length;

                let winningIndex = Math.floor((Math.PI * 2 - finalAngle) / arc) % participants.length;
                if (winningIndex < 0) winningIndex += participants.length;

                setWinner(participants[winningIndex]);
                playWinSound();

                // 🔥 Confetti celebration!
                console.log('[Confetti] Winner found:', participants[winningIndex]);

                // Pequeno delay para garantir que o estado do vencedor foi renderizado
                setTimeout(() => {
                    const count = 200;
                    const defaults = {
                        origin: { y: 0.7 },
                        zIndex: 9999,
                        colors: ['#3ABEF9', '#F9C80E', '#F87060', '#A1E887', '#9D4EDD', '#F15BB5']
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

                    console.log('[Confetti] Bursts fired!');
                }, 200);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const manualConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 9999,
            colors: ['#3ABEF9', '#F9C80E', '#F87060', '#A1E887', '#9D4EDD', '#F15BB5']
        });
    };

    const handleAddParticipant = () => {
        if (!inputValue.trim()) return;
        const names = inputValue.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
        setParticipants(prev => Array.from(new Set([...prev, ...names])).slice(0, 100));
        setInputValue('');
    };

    const handlePullChatters = (minutes?: number) => {
        console.log('[Giveaway] Puxando chatters, minutos:', minutes, 'Ativos:', activeChatters);
        const chatterEntries = Object.entries(activeChatters);
        if (chatterEntries.length === 0) {
            alert('Nenhum chatter ativo detectado ainda. Tente digitar algo no chat primeiro ou aguarde mensagens do YouTube.');
            return;
        }

        let filteredNames: string[];
        if (minutes) {
            const cutoff = Date.now() - minutes * 60 * 1000;
            filteredNames = chatterEntries
                .filter(([_, timestamp]) => timestamp >= cutoff)
                .map(([name]) => name);

            if (filteredNames.length === 0) {
                alert(`Nenhum chatter ativo nos últimos ${minutes} minutos.`);
                return;
            }
        } else {
            filteredNames = chatterEntries.map(([name]) => name);
        }

        setParticipants(prev => Array.from(new Set([...prev, ...filteredNames])).slice(0, 100));
    };

    const handleClearParticipants = () => {
        if (window.confirm('Limpar todos os participantes?')) {
            setParticipants([]);
            setWinner(null);
            spinAngleRef.current = 0;
            localStorage.removeItem('alice_giveaway_winner');
            localStorage.removeItem('alice_giveaway_angle');
            if (onClearExternalParticipants) {
                onClearExternalParticipants();
            }
        }
    };

    const handleRemoveParticipant = (name: string) => {
        setParticipants(prev => prev.filter(p => p !== name));
        if (onRemoveExternalParticipant) {
            onRemoveExternalParticipant(name);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar Controls */}
            <div className="lg:w-80 flex flex-col gap-6">
                <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <UsersIcon className="w-5 h-5 text-cyan-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Participantes</h3>
                    </div>

                    <div className="space-y-2">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Um nome por linha..."
                            className="w-full h-32 bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none shadow-inner"
                        />
                        <button
                            onClick={handleAddParticipant}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-sm"
                        >
                            Adicionar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handlePullChatters()}
                                className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 font-bold py-2 px-2 rounded-xl transition-all text-[10px] uppercase tracking-wider"
                                title="Puxar todos os que falaram"
                            >
                                <RefreshCwIcon className="w-3 h-3" />
                                Todos
                            </button>
                            <button
                                onClick={() => handlePullChatters(5)}
                                className="flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/20 font-bold py-2 px-2 rounded-xl transition-all text-[10px] uppercase tracking-wider"
                                title="Puxar quem falou nos últimos 5 minutos"
                            >
                                <TimerIcon className="w-3 h-3" />
                                Ativos (5m)
                            </button>
                        </div>
                        <button
                            onClick={handleClearParticipants}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-2 px-3 rounded-xl transition-all text-[10px] uppercase tracking-wider w-full"
                        >
                            Limpar Tudo
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex-grow overflow-hidden flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                        Lista ({participants.length})
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1">
                        {participants.map((name, i) => (
                            <div key={i} className="group flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-100 bg-gray-50 dark:bg-[#1e293b] px-3 py-2 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-gray-300 dark:hover:border-white/10 transition-all">
                                <span className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: colors[i % colors.length] }} />
                                <span className="truncate font-bold flex-grow">{name}</span>
                                <button
                                    onClick={() => handleRemoveParticipant(name)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Remover participante"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Wheel Area */}
            <div className="flex-grow bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col items-center relative min-h-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50 rounded-t-3xl" />

                <header className="w-full flex justify-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500 shadow-lg shadow-red-500/30 rounded-2xl rotate-3">
                            <span className="text-white font-black text-xl">R</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sorteio de Roleta</h2>
                    </div>
                </header>

                <div className="flex-grow flex flex-col items-center justify-center w-full min-h-0">
                    <div className="relative w-fit h-fit flex items-center justify-center mt-4">
                        {/* Pointer - Positioned relative to wheel container */}
                        <div className="absolute -right-6 md:-right-8 top-1/2 -translate-y-1/2 z-20">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-red-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-[#131b2e]">
                                <div className="w-0 h-0 border-t-[6px] md:border-t-[8px] border-t-transparent border-b-[6px] md:border-b-[8px] border-b-transparent border-l-[10px] md:border-l-[12px] border-l-red-500 absolute -left-2" />
                            </div>
                        </div>

                        {/* The Wheel */}
                        <canvas
                            ref={canvasRef}
                            width={440}
                            height={440}
                            className={`max-w-full max-h-[40vh] md:max-h-[440px] h-auto w-auto drop-shadow-2xl transition-transform ${isSpinning ? 'scale-[1.02]' : 'scale-100'}`}
                        />
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-md shrink-0">
                    {winner && !isSpinning && (
                        <div className="text-center animate-in zoom-in fade-in duration-500">
                            <div className="flex items-center justify-center gap-2 text-emerald-500 mb-0.5">
                                <TrophyIcon className="w-4 h-4 animate-bounce" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Vencedor(a)</span>
                            </div>
                            <div className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter drop-shadow-sm">
                                {winner}
                            </div>
                        </div>
                    )}

                    <div className="flex w-full gap-2 mt-4">
                        <button
                            onClick={handleSpin}
                            disabled={isSpinning || participants.length < 2}
                            className={`flex-grow flex items-center justify-center gap-3 py-4 md:py-5 px-8 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl uppercase tracking-widest transition-all shadow-2xl ${isSpinning || participants.length < 2
                                    ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white hover:scale-105 active:scale-95 shadow-orange-500/20'
                                }`}
                        >
                            {isSpinning ? (
                                <RefreshCwIcon className="w-6 h-6 animate-spin" />
                            ) : (
                                <GiftIcon className="w-6 h-6 md:w-7 md:h-7" />
                            )}
                            {isSpinning ? 'Girando...' : 'Girar Roleta'}
                        </button>

                        {winner && (
                            <button
                                onClick={manualConfetti}
                                className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-2xl md:rounded-3xl transition-all"
                                title="Mais confetes!"
                            >
                                ✨
                            </button>
                        )}
                    </div>

                    {participants.length < 2 && (
                        <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Adicione ao menos 2 participantes para girar</p>
                    )}
                </div>
            </div>
        </div >
    );
};
