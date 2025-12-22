import React, { useState, useEffect } from 'react';
import { UsersIcon, ArrowRightCircleIcon, TrashIcon, CopyIcon, CheckIcon, ArrowUpCircleIcon } from './Icons';
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
}

const TimerBar: React.FC<{ startTime: number; timeoutMinutes: number }> = ({ startTime, timeoutMinutes }) => {
    const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remaining = (timeoutMinutes * 60) - elapsedSeconds;
            setTimeLeft(Math.max(0, remaining));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, timeoutMinutes]);

    const totalSeconds = timeoutMinutes * 60;
    const percentage = (timeLeft / totalSeconds) * 100;

    let barColor = 'bg-cyan-500';
    if (percentage < 50) barColor = 'bg-yellow-500';
    if (percentage < 25) barColor = 'bg-red-500';

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2 relative">
            <div
                className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute -top-1 right-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
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

    const handleCopy = () => {
        if (queueUser.nickname) {
            navigator.clipboard.writeText(queueUser.nickname);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const getRankStyles = (idx: number) => {
        switch (idx) {
            case 0: // 1st Place - Green
                return "border-l-4 border-lime-500 bg-lime-50/50 dark:bg-lime-900/10";
            case 1: // 2nd Place - Yellow
                return "border-l-4 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10";
            case 2: // 3rd Place - Red
                return "border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10";
            default:
                return "bg-gray-100 dark:bg-gray-700/80 border-l-4 border-transparent";
        }
    };

    return (
        <div className={`flex flex-col p-3 rounded-md gap-2 ${getRankStyles(index)}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-cyan-500 dark:text-cyan-400 font-bold text-lg flex-shrink-0 w-8 text-center">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{queueUser.user}</p>
                        {queueUser.nickname && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{queueUser.nickname}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {index > 0 && (
                        <button
                            onClick={onMoveToTop}
                            className="text-gray-400 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 p-1"
                            title={`Mover ${queueUser.user} para o topo da fila`}
                        >
                            <ArrowUpCircleIcon className="w-6 h-6" />
                        </button>
                    )}
                    {queueUser.nickname && (
                        <button
                            onClick={handleCopy}
                            className="text-gray-400 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 p-1"
                            title={`Copiar apelido: ${queueUser.nickname}`}
                        >
                            {isCopied ? <CheckIcon className="w-5 h-5 text-lime-500" /> : <CopyIcon className="w-5 h-5" />}
                        </button>
                    )}
                    <button
                        onClick={onMoveToPlaying}
                        className="text-gray-400 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors duration-200 p-1"
                        title={`Mover ${queueUser.user} para 'Jogando Agora'`}
                    >
                        <ArrowRightCircleIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onRemoveUser}
                        className="text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 p-1"
                        title={`Remover ${queueUser.user} da fila`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {isTimerActive && startTime && <TimerBar startTime={startTime} timeoutMinutes={timeoutMinutes} />}
        </div>
    );
};


export const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue, userTimers, isTimerActive, timeoutMinutes, adminName, onMoveToPlaying, onRemoveUser, onMoveToTop }) => {
    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UsersIcon className="text-cyan-500 dark:text-cyan-400" />
                Fila Atual ({queue.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 flex-grow scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
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
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 dark:text-gray-500 italic text-center">A fila está vazia.</p>
                    </div>
                )}
            </div>
        </div>
    );
};