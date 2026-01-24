import React, { useState, useEffect } from 'react';
import { Gamepad2Icon, TrashIcon, UserIcon, CopyIcon, CheckIcon, ArrowUpCircleIcon, TimerIcon } from './Icons';
import type { QueueUser } from '../types';

interface PlayingDisplayProps {
    playingUsers: QueueUser[];
    onRemoveUser: (user: string) => void;
    onMoveBackToQueue: (user: string) => void;
    timeoutMinutes: number;
    timeoutSeconds: number;
}

export const PlayingDisplay: React.FC<PlayingDisplayProps> = ({
    playingUsers,
    onRemoveUser,
    onMoveBackToQueue,
    timeoutMinutes,
    timeoutSeconds,
}) => {
    const [copiedUser, setCopiedUser] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCopy = (text: string, userId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUser(userId);
        setTimeout(() => setCopiedUser(null), 2000);
    };

    const getRemainingTime = (startedAt?: string) => {
        if (!startedAt) return null;
        const start = new Date(startedAt).getTime();
        const limit = (timeoutMinutes * 60 + timeoutSeconds) * 1000;
        const elapsed = currentTime - start;
        const remaining = Math.max(0, limit - elapsed);

        const totalRemainingSecs = Math.floor(remaining / 1000);
        const mins = Math.floor(totalRemainingSecs / 60);
        const secs = totalRemainingSecs % 60;

        return {
            text: `${mins}:${secs.toString().padStart(2, '0')}`,
            isExpired: remaining === 0,
            percent: (remaining / limit) * 100
        };
    };

    return (
        <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#162036] flex items-center justify-between gap-2 overflow-hidden">
                <h2 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2 flex-shrink-0">
                    <Gamepad2Icon className="w-4 h-4 text-lime-400" />
                    <span className="hidden sm:inline">Jogando Agora</span>
                </h2>
                <span className="bg-lime-500/10 text-lime-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-lime-500/20 uppercase tracking-tighter flex-shrink-0">
                    On-line
                </span>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-grow bg-gray-100 dark:bg-[#0f111a]">
                {playingUsers.length > 0 ? (
                    playingUsers.map((playingUser) => {
                        const timer = getRemainingTime(playingUser.started_at);
                        return (
                            <div key={playingUser.user} className="group flex flex-col bg-gray-200/60 dark:bg-[#1e2947]/40 hover:bg-gray-300/60 dark:hover:bg-[#1e2947]/60 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 p-4 rounded-xl transition-all gap-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                            <UserIcon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white truncate">{playingUser.user}</p>
                                            {playingUser.nickname && <p className="text-xs text-gray-500 truncate">{playingUser.nickname}</p>}
                                        </div>
                                    </div>

                                    {timer && (
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-mono font-bold text-xs ${timer.isExpired
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                                            : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                            }`}>
                                            <TimerIcon className="w-3 h-3" />
                                            {timer.text}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t border-gray-200/50 dark:border-gray-800/50 pt-3">
                                    <button
                                        onClick={() => handleCopy(playingUser.nickname || playingUser.user, playingUser.user)}
                                        className={`p-2 rounded-lg transition-all ${copiedUser === playingUser.user
                                            ? 'bg-emerald-500/20 text-emerald-500'
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                                            }`}
                                        title="Copiar Apelido"
                                    >
                                        {copiedUser === playingUser.user ? (
                                            <CheckIcon className="w-4 h-4" />
                                        ) : (
                                            <CopyIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => onMoveBackToQueue(playingUser.user)}
                                        className="bg-gray-800 hover:bg-cyan-600 text-gray-400 hover:text-white p-2 rounded-lg transition-all"
                                        title={`Mover ${playingUser.user} de volta para a fila`}
                                    >
                                        <ArrowUpCircleIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemoveUser(playingUser.user)}
                                        className="bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white p-2 rounded-lg transition-all"
                                        title={`Remover ${playingUser.user}`}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-10 grayscale opacity-40">
                        <Gamepad2Icon className="w-12 h-12 text-gray-500" />
                        <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Ninguém jogando no momento</p>
                    </div>
                )}
            </div>
        </div>
    );
};