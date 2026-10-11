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
    onRefresh?: () => void;
}

// Paleta de gradientes para avatares — cada usuário ganha uma cor consistente
const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    'linear-gradient(135deg, #84cc16 0%, #10b981 100%)',
    'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)',
];

const getAvatarGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const TimerBar: React.FC<{ timeLeft: number; totalSeconds: number }> = ({ timeLeft, totalSeconds }) => {
    const percentage = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));
    let barColor = '#00c8ff';
    if (percentage < 50) barColor = '#f59e0b';
    if (percentage < 25) barColor = '#ef4444';

    return (
        <div className="w-full rounded-full h-1 mt-2.5 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${percentage}%`, backgroundColor: barColor }}
            />
        </div>
    );
};

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const getRankStyle = (idx: number): React.CSSProperties => {
    if (idx === 0) return { color: '#fbbf24' };  // gold
    if (idx === 1) return { color: '#94a3b8' };  // silver
    if (idx === 2) return { color: '#f97316' };  // bronze
    return { color: '#3a5a7a' };
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
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setTimeLeft(Math.max(0, timeoutMinutes * 60 - elapsed));
        };
        updateTimer();
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

    return (
        <div
            className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-150 cursor-default"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(0,200,255,0.04)')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
        >
            {/* Rank number */}
            <span className="text-sm font-black w-6 text-center flex-shrink-0 italic" style={getRankStyle(index)}>
                {index + 1}
            </span>

            {/* Avatar */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 select-none"
                style={{ background: getAvatarGradient(queueUser.user) }}
            >
                {queueUser.user.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{queueUser.user}</p>
                <div className="flex items-center gap-2 mt-1">
                    {queueUser.nickname ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold truncate tracking-tight" style={{ color: '#00c8ff' }}>
                                {queueUser.nickname}
                            </span>
                            <button
                                onClick={handleCopy}
                                title="Copiar apelido"
                                className="p-1.5 rounded-lg transition-all active:scale-90 flex items-center justify-center flex-shrink-0"
                                style={{
                                    backgroundColor: isCopied ? 'rgba(16,185,129,0.2)' : 'rgba(0,200,255,0.12)',
                                    color: isCopied ? '#10b981' : '#00c8ff',
                                    border: `1px solid ${isCopied ? 'rgba(16,185,129,0.35)' : 'rgba(0,200,255,0.25)'}`
                                }}
                                onMouseOver={e => {
                                    if (!isCopied) e.currentTarget.style.backgroundColor = 'rgba(0,200,255,0.22)';
                                }}
                                onMouseOut={e => {
                                    if (!isCopied) e.currentTarget.style.backgroundColor = 'rgba(0,200,255,0.12)';
                                }}
                            >
                                {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs font-medium" style={{ color: '#3a5a7a' }}>Na fila de espera</p>
                    )}
                    {isTimerActive && (
                        <span
                            className="font-mono text-xs font-bold ml-auto pl-2 flex-shrink-0"
                            style={{ color: timeLeft < 60 ? '#ef4444' : timeLeft < 120 ? '#f59e0b' : '#3a5a7a', borderLeft: '1px solid #1a2540' }}
                        >
                            {formatTime(timeLeft)}
                        </span>
                    )}
                </div>
                {isTimerActive && <TimerBar timeLeft={timeLeft} totalSeconds={timeoutMinutes * 60} />}
            </div>

            {/* Action buttons — appear on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {index > 0 && (
                    <button
                        onClick={onMoveToTop}
                        title="Mover para o topo"
                        className="p-1.5 rounded-lg transition-all active:scale-90"
                        style={{ backgroundColor: '#1a2540', color: '#3a5a7a' }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(0,200,255,0.15)'; e.currentTarget.style.color = '#00c8ff'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = '#1a2540'; e.currentTarget.style.color = '#3a5a7a'; }}
                    >
                        <ArrowUpCircleIcon className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={onMoveToPlaying}
                    title="Mover para Jogando"
                    className="p-1.5 rounded-lg transition-all active:scale-90"
                    style={{ backgroundColor: '#1a2540', color: '#3a5a7a' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(0,230,118,0.15)'; e.currentTarget.style.color = '#00e676'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#1a2540'; e.currentTarget.style.color = '#3a5a7a'; }}
                >
                    <ArrowRightCircleIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={onRemoveUser}
                    title="Remover da fila"
                    className="p-1.5 rounded-lg transition-all active:scale-90"
                    style={{ backgroundColor: '#1a2540', color: '#3a5a7a' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,77,77,0.15)'; e.currentTarget.style.color = '#ff4d4d'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#1a2540'; e.currentTarget.style.color = '#3a5a7a'; }}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export const QueueDisplay: React.FC<QueueDisplayProps> = ({
    queue, userTimers, isTimerActive, timeoutMinutes, adminName,
    onMoveToPlaying, onRemoveUser, onMoveToTop, onNext, onReset, onRefresh
}) => {
    return (
        <div
            className="flex flex-col h-full overflow-hidden rounded-2xl"
            style={{ backgroundColor: '#0d1526', border: '1px solid #1a2540' }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between gap-2 px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid #1a2540' }}
            >
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#00c8ff' } as any} />
                    <h2 className="text-sm font-bold text-white">Fila de Espera</h2>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(0,200,255,0.1)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.15)' }}
                    >
                        {queue.length}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    {onNext && (
                        <button
                            onClick={onNext}
                            title="Próximo"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                            style={{ backgroundColor: '#00c8ff', color: '#000d1a' }}
                            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#00aada')}
                            onMouseOut={e => (e.currentTarget.style.backgroundColor = '#00c8ff')}
                        >
                            <SkipForwardIcon className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Próximo</span>
                        </button>
                    )}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            title="Atualizar"
                            className="p-1.5 rounded-lg transition-all active:scale-95"
                            style={{ backgroundColor: '#1a2540', color: '#3a5a7a' }}
                            onMouseOver={e => { e.currentTarget.style.color = '#00c8ff'; }}
                            onMouseOut={e => { e.currentTarget.style.color = '#3a5a7a'; }}
                        >
                            <RefreshCwIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onReset && (
                        <button
                            onClick={onReset}
                            title="Resetar fila"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                            style={{ backgroundColor: '#1a2540', color: '#3a5a7a', border: '1px solid #253560' }}
                            onMouseOver={e => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.color = '#3a5a7a'; e.currentTarget.style.borderColor = '#253560'; }}
                        >
                            <RefreshCwIcon className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Resetar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar" style={{ backgroundColor: '#080d18' }}>
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
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-20 opacity-25">
                        <UsersIcon className="w-12 h-12" style={{ color: '#3a5a7a' } as any} />
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3a5a7a' }}>
                            Fila vazia
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};