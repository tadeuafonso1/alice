import React, { useState } from 'react';
import { Gamepad2Icon, TrashIcon, UserIcon, CopyIcon, CheckIcon, ArrowUpCircleIcon, LockIcon, UnlockIcon } from './Icons';
import type { QueueUser } from '../types';

// Reutiliza a mesma paleta de gradientes do QueueDisplay para consistência visual
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
                className="flex items-center justify-between gap-2 px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid #1a2540' }}
            >
                <div className="flex items-center gap-2">
                    <Gamepad2Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#00e676' } as any} />
                    <h2 className="text-sm font-bold text-white">Jogando Agora</h2>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(0,230,118,0.1)', color: '#00e676', border: '1px solid rgba(0,230,118,0.15)' }}
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
                        ? { backgroundColor: 'rgba(255,77,77,0.08)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.15)' }
                        : { backgroundColor: 'rgba(0,230,118,0.08)', color: '#00e676', border: '1px solid rgba(0,230,118,0.15)' }
                    }
                    onMouseOver={e => {
                        e.currentTarget.style.opacity = '0.8';
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
            <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar" style={{ backgroundColor: '#080d18' }}>
                {playingUsers.length > 0 ? (
                    playingUsers.map((playingUser) => (
                        <div
                            key={playingUser.user}
                            className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                            style={{
                                backgroundColor: 'rgba(0,230,118,0.04)',
                                border: '1px solid rgba(0,230,118,0.12)',
                                borderLeft: '3px solid rgba(0,230,118,0.5)',
                            }}
                            onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(0,230,118,0.07)')}
                            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgba(0,230,118,0.04)')}
                        >
                            {/* Avatar */}
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 select-none"
                                style={{ background: getAvatarGradient(playingUser.user) }}
                            >
                                {playingUser.user.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate leading-tight">{playingUser.user}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: '#00e676' }}
                                    />
                                    <p className="text-[10px] font-semibold" style={{ color: '#00e676' }}>
                                        {playingUser.nickname || 'Jogando'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                    onClick={() => handleCopy(playingUser.nickname || playingUser.user, playingUser.user)}
                                    title="Copiar nome/apelido"
                                    className="p-1.5 rounded-lg transition-all active:scale-90"
                                    style={{
                                        backgroundColor: copiedUser === playingUser.user ? 'rgba(16,185,129,0.15)' : '#1a2540',
                                        color: copiedUser === playingUser.user ? '#10b981' : '#3a5a7a',
                                    }}
                                    onMouseOver={e => { if (copiedUser !== playingUser.user) { e.currentTarget.style.color = '#00c8ff'; } }}
                                    onMouseOut={e => { if (copiedUser !== playingUser.user) { e.currentTarget.style.color = '#3a5a7a'; } }}
                                >
                                    {copiedUser === playingUser.user
                                        ? <CheckIcon className="w-3.5 h-3.5" />
                                        : <CopyIcon className="w-3.5 h-3.5" />
                                    }
                                </button>
                                <button
                                    onClick={() => onMoveBackToQueue(playingUser.user)}
                                    title="Voltar para a fila"
                                    className="p-1.5 rounded-lg transition-all active:scale-90"
                                    style={{ backgroundColor: '#1a2540', color: '#3a5a7a' }}
                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(0,200,255,0.15)'; e.currentTarget.style.color = '#00c8ff'; }}
                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#1a2540'; e.currentTarget.style.color = '#3a5a7a'; }}
                                >
                                    <ArrowUpCircleIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => onRemoveUser(playingUser.user)}
                                    title={`Remover ${playingUser.user}`}
                                    className="p-1.5 rounded-lg transition-all active:scale-90"
                                    style={{ backgroundColor: '#1a2540', color: '#3a5a7a' }}
                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,77,77,0.15)'; e.currentTarget.style.color = '#ff4d4d'; }}
                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#1a2540'; e.currentTarget.style.color = '#3a5a7a'; }}
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-16 opacity-25">
                        <Gamepad2Icon className="w-12 h-12" style={{ color: '#3a5a7a' } as any} />
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3a5a7a' }}>
                            Ninguém jogando
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};