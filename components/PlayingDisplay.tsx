import React from 'react';
import { Gamepad2Icon, TrashIcon, UserIcon } from './Icons';
import type { QueueUser } from '../types';

interface PlayingDisplayProps {
    playingUsers: QueueUser[];
    onRemoveUser: (user: string) => void;
}

export const PlayingDisplay: React.FC<PlayingDisplayProps> = ({ 
    playingUsers,
    onRemoveUser,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Gamepad2Icon className="text-lime-500 dark:text-lime-400"/>
                Jogando Agora ({playingUsers.length})
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 flex-grow">
                {playingUsers.length > 0 ? (
                    playingUsers.map((playingUser) => (
                         <div key={playingUser.user} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/80 p-3 rounded-md gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{playingUser.user}</p>
                                    {playingUser.nickname && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{playingUser.nickname}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => onRemoveUser(playingUser.user)}
                                className="text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 flex-shrink-0"
                                title={`Remover ${playingUser.user} da seção de jogo`}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 dark:text-gray-500 italic text-center">Ninguém está jogando.</p>
                    </div>
                )}
            </div>
        </div>
    );
};