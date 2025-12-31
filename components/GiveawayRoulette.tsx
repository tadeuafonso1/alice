import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GiftIcon, RefreshCwIcon, TrophyIcon, UsersIcon } from './Icons';

interface GiveawayRouletteProps {
    activeChatters: string[];
}

export const GiveawayRoulette: React.FC<GiveawayRouletteProps> = ({ activeChatters }) => {
    const [participants, setParticipants] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spinAngleRef = useRef(0);
    const animationFrameRef = useRef<number | undefined>(undefined);

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
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleAddParticipant = () => {
        if (!inputValue.trim()) return;
        const names = inputValue.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
        setParticipants(prev => Array.from(new Set([...prev, ...names])).slice(0, 100));
        setInputValue('');
    };

    const handlePullChatters = () => {
        if (activeChatters.length === 0) {
            alert('Nenhum chatter ativo detectado ainda.');
            return;
        }
        setParticipants(Array.from(new Set(activeChatters)));
    };

    const handleClearParticipants = () => {
        if (window.confirm('Limpar todos os participantes?')) {
            setParticipants([]);
            setWinner(null);
            spinAngleRef.current = 0;
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
                            placeholder="Um nome por linha ou separado por vírgula..."
                            className="w-full h-32 bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none"
                        />
                        <button
                            onClick={handleAddParticipant}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-sm"
                        >
                            Adicionar
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                            onClick={handlePullChatters}
                            className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 font-bold py-2 px-3 rounded-xl transition-all text-[11px] uppercase tracking-wider"
                        >
                            <RefreshCwIcon className="w-3 h-3" />
                            Puxar Chat
                        </button>
                        <button
                            onClick={handleClearParticipants}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-2 px-3 rounded-xl transition-all text-[11px] uppercase tracking-wider"
                        >
                            Limpar
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex-grow overflow-hidden flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                        Lista ({participants.length})
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1">
                        {participants.map((name, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#162036] px-3 py-1.5 rounded-lg">
                                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                                <span className="truncate font-medium">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Wheel Area */}
            <div className="flex-grow bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl flex flex-col items-center relative min-h-[600px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50 rounded-t-3xl" />

                <header className="w-full flex justify-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500 shadow-lg shadow-red-500/30 rounded-2xl rotate-3">
                            <span className="text-white font-black text-xl">R</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sorteio de Roleta</h2>
                    </div>
                </header>

                <div className="relative mt-4 flex-grow flex items-center justify-center w-full">
                    {/* Pointer */}
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-[#131b2e]">
                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-red-500 absolute -left-2" />
                        </div>
                    </div>

                    {/* The Wheel */}
                    <canvas
                        ref={canvasRef}
                        width={500}
                        height={500}
                        className={`max-w-full max-h-[500px] w-auto h-auto drop-shadow-2xl transition-transform ${isSpinning ? 'scale-[1.02]' : 'scale-100'}`}
                    />
                </div>

                <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-md">
                    {winner && !isSpinning && (
                        <div className="text-center animate-in zoom-in fade-in duration-500">
                            <div className="flex items-center justify-center gap-2 text-emerald-500 mb-1">
                                <TrophyIcon className="w-5 h-5 animate-bounce" />
                                <span className="text-xs font-black uppercase tracking-widest">Vencedor(a)</span>
                            </div>
                            <div className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1 drop-shadow-sm">
                                {winner}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSpin}
                        disabled={isSpinning || participants.length < 2}
                        className={`group relative w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all
                            ${isSpinning || participants.length < 2
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/40 active:scale-95'
                            } `}
                    >
                        <span className="flex items-center justify-center gap-3">
                            {isSpinning ? (
                                <>
                                    <RefreshCwIcon className="w-6 h-6 animate-spin" />
                                    Girando...
                                </>
                            ) : (
                                <>
                                    Girar Roleta
                                    <GiftIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                </>
                            )}
                        </span>
                    </button>

                    {participants.length < 2 && (
                        <p className="text-xs text-gray-500 font-medium">Adicione ao menos 2 participantes para girar</p>
                    )}
                </div>
            </div>
        </div>
    );
};
