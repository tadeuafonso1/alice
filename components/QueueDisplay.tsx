import React, { useState, useEffect } from 'react';
import { UsersIcon, ArrowRightIcon, TrashIcon, CopyIcon, CheckIcon, ArrowUpIcon, SkipForwardIcon, RefreshCwIcon } from './Icons';
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

// Esferas com gradientes radiais suaves (efeito 3D da imagem)
const SPHERE_GRADIENTS = [
    'radial-gradient(circle at 35% 35%, #60a5fa, #3b82f6 50%, #1e3a8a 100%)',
    'radial-gradient(circle at 35% 35%, #f472b6, #ec4899 50%, #831843 100%)',
    'radial-gradient(circle at 35% 35%, #34d399, #0d9488 50%, #064e3b 100%)',
    'radial-gradient(circle at 35% 35%, #fb7185, #ef4444 50%, #7f1d1d 100%)',
    'radial-gradient(circle at 35% 35%, #fbbf24, #f97316 50%, #7c2d12 100%)',
    'radial-gradient(circle at 35% 35%, #c084fc, #9333ea 50%, #581c87 100%)',
    'radial-gradient(circle at 35% 35%, #38bdf8, #0284c7 50%, #082f49 100%)',
];

const getSphereGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return SPHERE_GRADIENTS[Math.abs(hash) % SPHERE_GRADIENTS.length];
};

const TimerBar: React.FC<{ timeLeft: number; totalSeconds: number }> = ({ timeLeft, totalSeconds }) => {
    const percentage = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));
    let barColor = '#00c8ff';
    if (percentage < 50) barColor = '#f59e0b';
    if (percentage < 25) barColor = '#ef4444';

    return (
        <div className="w-full rounded-full h-1 mt-2 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
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

const QueueItem: React.FC<{
    queueUser: QueueUser;
    index: number;
    isTimerActive: boolean;
    startTime?: number;
    timeoutMinutes: number;
    onMoveToPlaying: () => void;
    onRemoveUser: () => void;
    onMoveToTop: () => void;
}> = ({
    queueUser, index, isTimerActive, startTime, timeoutMinutes,
    onMoveToPlaying, onRemoveUser, onMoveToTop
}) => {
    const [timeLeft, setTimeLeft] = useState<number>(timeoutMinutes * 60);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isTimerActive || !startTime) {
            setTimeLeft(timeoutMinutes * 60);
            return;
        }

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, timeoutMinutes * 60 - elapsed);
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isTimerActive, startTime, timeoutMinutes]);

    const handleCopy = () => {
        const textToCopy = queueUser.nickname || queueUser.user;
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Apelido como título principal se houver, ou nome do usuário
    const primaryName = queueUser.nickname || queueUser.user;
    const secondaryHandle = `@${queueUser.user}`;

    return (
        <div
            className="flex items-center gap-3.5 px-4 py-3.5 transition-colors cursor-default"
            style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            {/* Avatar esfera 3D */}
            <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none shadow-md"
                style={{
                    background: getSphereGradient(queueUser.user),
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                }}
            >
                {/* Visual limpo conforme a imagem */}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                        {primaryName}
                    </p>
                    {/* Botão de copiar discreto ao lado do apelido */}
                    <button
                        onClick={handleCopy}
                        title="Copiar apelido"
                        className="p-1 rounded-md transition-all active:scale-90 flex items-center justify-center flex-shrink-0"
                        style={{
                            backgroundColor: isCopied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                            color: isCopied ? '#10b981' : '#64748b',
                            border: `1px solid ${isCopied ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.06)'}`
                        }}
                        onMouseOver={e => {
                            if (!isCopied) {
                                e.currentTarget.style.color = '#00c8ff';
                                e.currentTarget.style.backgroundColor = 'rgba(0,200,255,0.1)';
                            }
                        }}
                        onMouseOut={e => {
                            if (!isCopied) {
                                e.currentTarget.style.color = '#64748b';
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                            }
                        }}
                    >
                        {isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-slate-400 truncate">
                        {secondaryHandle}
                    </span>
                    {isTimerActive && (
                        <span
                            className="font-mono text-xs font-bold ml-auto pl-2 flex-shrink-0"
                            style={{
                                color: timeLeft < 60 ? '#ef4444' : timeLeft < 120 ? '#f59e0b' : '#3a5a7a',
                            }}
                        >
                            {formatTime(timeLeft)}
                        </span>
                    )}
                </div>

                {isTimerActive && <TimerBar timeLeft={timeLeft} totalSeconds={timeoutMinutes * 60} />}
            </div>

            {/* Número de posição (Nº 1) */}
            <span
                className="text-xs font-semibold text-slate-400 select-none tracking-wide flex-shrink-0"
            >
                Nº {index + 1}
            </span>

            {/* Ações como na imagem (botões estilizados e organizados) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {index > 0 && (
                    <button
                        onClick={onMoveToTop}
                        title="Mover para o topo"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        style={{
                            backgroundColor: '#152238',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.15)',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.backgroundColor = '#1e3357';
                            e.currentTarget.style.color = '#00c8ff';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.backgroundColor = '#152238';
                            e.currentTarget.style.color = '#38bdf8';
                        }}
                    >
                        <ArrowUpIcon className="w-4 h-4" />
                    </button>
                )}

                {/* Botão Avançar -> */}
                <button
                    onClick={onMoveToPlaying}
                    title="Mover para Jogando"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        backgroundColor: '#152238',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.15)',
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = '#1e3357';
                        e.currentTarget.style.color = '#00c8ff';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = '#152238';
                        e.currentTarget.style.color = '#38bdf8';
                    }}
                >
                    <ArrowRightIcon className="w-4 h-4" />
                </button>

                {/* Botão Excluir (lixeira vermelha) */}
                <button
                    onClick={onRemoveUser}
                    title="Remover da fila"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#f87171';
                    }}
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
            {/* Header com badge igual à imagem */}
            <div
                className="flex items-center justify-between gap-2 px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid #1a2540' }}
            >
                <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-white tracking-tight">Fila de Espera</h2>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md select-none"
                        style={{
                            backgroundColor: '#00c8ff',
                            color: '#040b17',
                        }}
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
            <div className="flex-grow overflow-y-auto custom-scrollbar" style={{ backgroundColor: '#080d18' }}>
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
                        <p className="text-xs font-semibold" style={{ color: '#3a5a7a' }}>Fila vazia</p>
                    </div>
                )}
            </div>
        </div>
    );
};