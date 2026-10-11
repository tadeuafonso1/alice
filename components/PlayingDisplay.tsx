import React, { useState } from 'react';
import { Gamepad2Icon, TrashIcon, CopyIcon, CheckIcon, ArrowUpIcon, LockIcon, UnlockIcon } from './Icons';
import type { QueueUser } from '../types';

// Esferas com gradientes radiais suaves (efeito 3D consistente com QueueDisplay)
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

interface PlayingDisplayProps {
    playingUsers: QueueUser[];
    onRemoveUser: (user: string) => void;
    onMoveBackToQueue: (user: string) => void;
    isQueueOpen: boolean;
    onToggleQueue: () => void;
}

export const PlayingDisplay: React.FC<PlayingDisplayProps> = ({
    playingUsers,
    onRemoveUser,
    onMoveBackToQueue,
    isQueueOpen,
    onToggleQueue,
}) => {
    const [copiedUser, setCopiedUser] = useState<string | null>(null);

    const handleCopy = (text: string, userId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUser(userId);
        setTimeout(() => setCopiedUser(null), 2000);
    };

    return (
        <div
            className="flex flex-col h-full overflow-hidden rounded-2xl"
            style={{ backgroundColor: '#0d1526', border: '1px solid #1a2540' }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between gap-2 px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid #1a2540' }}
            >
                <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-white tracking-tight">Jogando Agora</h2>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md select-none"
                        style={{
                            backgroundColor: '#00e676',
                            color: '#040b17',
                        }}
                    >
                        {playingUsers.length}
                    </span>
                </div>

                {/* Toggle queue open/close */}
                <button
                    onClick={onToggleQueue}
                    title={isQueueOpen ? 'Fechar Fila' : 'Abrir Fila'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                    style={isQueueOpen
                        ? { backgroundColor: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' }
                        : { backgroundColor: 'rgba(0,230,118,0.1)', color: '#00e676', border: '1px solid rgba(0,230,118,0.2)' }
                    }
                    onMouseOver={e => {
                        e.currentTarget.style.opacity = '0.85';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.opacity = '1';
                    }}
                >
                    {isQueueOpen
                        ? <LockIcon className="w-3.5 h-3.5" />
                        : <UnlockIcon className="w-3.5 h-3.5" />
                    }
                    <span className="hidden md:inline">{isQueueOpen ? 'Fechar Fila' : 'Abrir Fila'}</span>
                </button>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto custom-scrollbar" style={{ backgroundColor: '#080d18' }}>
                {playingUsers.length > 0 ? (
                    playingUsers.map((playingUser) => {
                        const primaryName = playingUser.nickname || playingUser.user;
                        const secondaryHandle = `@${playingUser.user}`;
                        const isCopied = copiedUser === playingUser.user;

                        return (
                            <div
                                key={playingUser.user}
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
                                        background: getSphereGradient(playingUser.user),
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                                    }}
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white truncate leading-tight">
                                            {primaryName}
                                        </p>
                                        <button
                                            onClick={() => handleCopy(playingUser.nickname || playingUser.user, playingUser.user)}
                                            title="Copiar apelido"
                                            className="p-1 rounded-md transition-all active:scale-90 flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: isCopied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                                                color: isCopied ? '#10b981' : '#64748b',
                                                border: `1px solid ${isCopied ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.06)'}`
                                            }}
                                            onMouseOver={e => {
                                                if (!isCopied) {
                                                    e.currentTarget.style.color = '#00e676';
                                                    e.currentTarget.style.backgroundColor = 'rgba(0,230,118,0.1)';
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

                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-xs font-medium text-slate-400 truncate">
                                            {secondaryHandle}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                        onClick={() => onMoveBackToQueue(playingUser.user)}
                                        title="Voltar para a fila"
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

                                    <button
                                        onClick={() => onRemoveUser(playingUser.user)}
                                        title={`Remover ${playingUser.user}`}
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
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-20 opacity-25">
                        <Gamepad2Icon className="w-12 h-12" style={{ color: '#3a5a7a' } as any} />
                        <p className="text-xs font-semibold" style={{ color: '#3a5a7a' }}>Ninguém jogando</p>
                    </div>
                )}
            </div>
        </div>
    );
};