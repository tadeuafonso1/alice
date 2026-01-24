import React, { useState } from 'react';
import { Gamepad2Icon, TrashIcon, UserIcon, CopyIcon, CheckIcon, ArrowUpCircleIcon } from './Icons';
import type { QueueUser } from '../types';

interface PlayingDisplayProps {
    playingUsers: QueueUser[];
    onRemoveUser: (user: string) => void;
    onMoveBackToQueue: (user: string) => void;
}

export const PlayingDisplay: React.FC<PlayingDisplayProps> = ({
    playingUsers,
    onRemoveUser,
    onMoveBackToQueue,
}) => {
    const [copiedUser, setCopiedUser] = useState<string | null>(null);

    const handleCopy = (text: string, userId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUser(userId);
        setTimeout(() => setCopiedUser(null), 2000);
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
                    playingUsers.map((playingUser) => (
                        <div key={playingUser.user} className="group flex items-center justify-between bg-gray-200/60 dark:bg-[#1e2947]/40 hover:bg-gray-300/60 dark:hover:bg-[#1e2947]/60 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 p-4 rounded-xl transition-all gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                    <UserIcon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{playingUser.user}</p>
                                    {playingUser.nickname && <p className="text-xs text-gray-500 truncate">{playingUser.nickname}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCopy(playingUser.nickname || playingUser.user, playingUser.user)}
                                    className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all ${copiedUser === playingUser.user
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
                                    className="opacity-0 group-hover:opacity-100 bg-gray-800 hover:bg-cyan-600 text-gray-400 hover:text-white p-2 rounded-lg transition-all"
                                    title={`Mover ${playingUser.user} de volta para a fila`}
                                >
                                    <ArrowUpCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onRemoveUser(playingUser.user)}
                                    className="opacity-0 group-hover:opacity-100 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white p-2 rounded-lg transition-all"
                                    title={`Remover ${playingUser.user}`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
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