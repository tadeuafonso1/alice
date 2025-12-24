import React, { useState, useEffect } from 'react';
import { UsersIcon, ArrowRightCircleIcon, TrashIcon, CopyIcon, CheckIcon, ArrowUpCircleIcon, SkipForwardIcon, RefreshCwIcon } from './Icons';
import type { QueueUser } from '../types';

interface QueueDisplayProps {
    queue: QueueUser[];
    userTimers: Record<string, number>;
    isTimerActive: boolean;
    timeoutMinutes: number;
    adminName: string;
    onMoveToPlaying: (user: string) => void;
    onRemoveUser: (user: string) => void;
    onMoveToTop: (user: string) => void;
    onNext?: () => void;
    onReset?: () => void;
}

const TimerBar: React.FC<{ timeLeft: number; totalSeconds: number }> = ({ timeLeft, totalSeconds }) => {
    const percentage = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));

    let barColor = 'bg-cyan-500';
    if (percentage < 50) barColor = 'bg-yellow-500';
    if (percentage < 25) barColor = 'bg-red-500';

    return (
        <div className="w-full bg-gray-800/50 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
                className={`h-full transition-all duration-1000 ease-linear ${barColor}`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

const QueueItem: React.FC<{
    queueUser: QueueUser;
    index: number;
    isTimerActive: boolean;
    startTime: number | undefined;
    timeoutMinutes: number;
    onMoveToPlaying: () => void;
    onRemoveUser: () => void;
    onMoveToTop: () => void;
}> = ({ queueUser, index, isTimerActive, startTime, timeoutMinutes, onMoveToPlaying, onRemoveUser, onMoveToTop }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);

    useEffect(() => {
        if (!isTimerActive || !startTime) return;

        const updateTimer = () => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remaining = (timeoutMinutes * 60) - elapsedSeconds;
            setTimeLeft(Math.max(0, remaining));
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isTimerActive, startTime, timeoutMinutes]);

    const handleCopy = () => {
        if (queueUser.nickname) {
            navigator.clipboard.writeText(queueUser.nickname);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const getRankColor = (idx: number) => {
        if (idx === 0) return "text-yellow-400";
        if (idx === 1) return "text-gray-300";
        if (idx === 2) return "text-orange-400";
        return "text-gray-500";
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="group bg-[#1e2947]/40 hover:bg-[#1e2947]/60 border border-gray-800 hover:border-gray-700 p-4 rounded-xl transition-all">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`font-black text-xl italic flex-shrink-0 w-8 ${getRankColor(index)}`}>
                        #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-base">{queueUser.user}</p>

                        <div className="flex items-center gap-4 mt-1">
                            {queueUser.nickname ? (
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-cyan-400 font-semibold truncate">
                                        {queueUser.nickname}
                                    </p>
                                    <button
                                        onClick={handleCopy}
                                        className="hover:bg-cyan-500/20 p-1.5 rounded-md transition-colors group"
                                        title="Copiar Apelido"
                                    >
                                        {isCopied ? (
                                            <CheckIcon className="w-4 h-4 text-lime-400" />
                                        ) : (
                                            <CopyIcon className="w-4 h-4 text-cyan-500/70 group-hover:text-cyan-400" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-[10px] text-gray-500 uppercase font-medium">Na fila de espera</p>
                            )}

                            {/* Timer Moved Here */}
                            {isTimerActive && (
                                <div className="font-mono text-xl font-black text-white tracking-widest pl-2 border-l-2 border-gray-700">
                                    {formatTime(timeLeft)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                        <button
                            onClick={onMoveToTop}
                            className="bg-gray-800 hover:bg-cyan-600 text-gray-400 hover:text-white p-2 rounded-lg transition-all active:scale-90 active:brightness-110"
                            title="Mover para o topo"
                        >
                            <ArrowUpCircleIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onMoveToPlaying}
                        className="bg-gray-800 hover:bg-lime-600 text-gray-400 hover:text-white p-2 rounded-lg transition-all active:scale-90 active:brightness-110"
                        title="Subir para o Jogo"
                    >
                        <ArrowRightCircleIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRemoveUser}
                        className="bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white p-2 rounded-lg transition-all active:scale-90 active:brightness-110"
                        title="Remover"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {isTimerActive && <TimerBar timeLeft={timeLeft} totalSeconds={timeoutMinutes * 60} />}
        </div>
    );
};

export const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue, userTimers, isTimerActive, timeoutMinutes, adminName, onMoveToPlaying, onRemoveUser, onMoveToTop, onNext, onReset }) => {
    return (
        <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#162036] flex items-center justify-between gap-2 overflow-hidden">
                <h2 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2 flex-shrink-0">
                    <UsersIcon className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">Fila</span>
                </h2>

                <div className="flex items-center gap-2 min-w-0">
                    {onNext && (
                        <button
                            onClick={onNext}
                            className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg active:scale-90 active:brightness-110 flex items-center gap-1.5 flex-shrink-0"
                            title="Próximo"
                        >
                            <SkipForwardIcon className="w-3 h-3" />
                            <span className="hidden md:inline">Próximo</span>
                        </button>
                    )}
                    {onReset && (
                        <button
                            onClick={onReset}
                            className="bg-transparent border border-gray-600 hover:border-gray-400 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-90 flex items-center gap-1.5 flex-shrink-0"
                            title="Resetar"
                        >
                            <RefreshCwIcon className="w-3 h-3" />
                            <span className="hidden md:inline">Resetar</span>
                        </button>
                    )}
                </div>

                <span className="bg-cyan-500/10 text-cyan-400 text-sm font-black px-4 py-1 rounded-full border border-cyan-500/20 uppercase tracking-tighter flex-shrink-0">
                    {queue.length} <span className="hidden lg:inline">Total</span>
                </span>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-grow bg-gray-100 dark:bg-[#0f111a]">
                {queue.length > 0 ? (
                    queue.map((queueUser, index) => (
                        <QueueItem
                            key={queueUser.user}
                            queueUser={queueUser}
                            index={index}
                            isTimerActive={isTimerActive}
                            startTime={userTimers[queueUser.user]}
                            timeoutMinutes={timeoutMinutes}
                            onMoveToPlaying={() => onMoveToPlaying(queueUser.user)}
                            onRemoveUser={() => onRemoveUser(queueUser.user)}
                            onMoveToTop={() => onMoveToTop(queueUser.user)}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-20 grayscale opacity-40">
                        <UsersIcon className="w-16 h-16 text-gray-500" />
                        <p className="text-gray-500 font-bold uppercase tracking-wider text-xs">Fila está vazia por enquanto</p>
                    </div>
                )}
            </div>
        </div>
    );
};