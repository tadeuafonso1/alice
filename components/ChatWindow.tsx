import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { BotIcon, ShieldIcon } from './Icons';

interface ChatWindowProps {
    messages: Message[];
    currentUser: string;
    small?: boolean;
    onBlockUser?: (channelId: string, username: string) => void;
}

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

const TWITCH_COLORS = [
    '#38bdf8', // sky
    '#818cf8', // indigo
    '#34d399', // emerald
    '#f472b6', // pink
    '#fbbf24', // amber
    '#a78bfa', // violet
    '#2dd4bf', // teal
    '#fb923c', // orange
];

const getUsernameColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TWITCH_COLORS[Math.abs(hash) % TWITCH_COLORS.length];
};

const MessageItem: React.FC<{
    message: Message;
    isCurrentUser: boolean;
    small?: boolean;
    onBlockClick?: (channelId: string, username: string) => void;
}> = ({ message, isCurrentUser, small, onBlockClick }) => {
    const { author, text, type } = message;

    if (type === 'bot') {
        return (
            <div className={`flex items-start gap-2.5 animate-fadeIn group`}>
                {/* Bot Avatar */}
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
                    style={{
                        background: 'linear-gradient(135deg, #00c8ff 0%, #0070f3 100%)',
                        boxShadow: '0 0 10px rgba(0, 200, 255, 0.25)'
                    }}
                >
                    <BotIcon className="w-4 h-4 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs tracking-tight" style={{ color: '#00c8ff' }}>
                            {author}
                        </span>
                        <span
                            className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded"
                            style={{
                                backgroundColor: 'rgba(0, 200, 255, 0.12)',
                                color: '#00c8ff',
                                border: '1px solid rgba(0, 200, 255, 0.2)'
                            }}
                        >
                            BOT
                        </span>
                    </div>
                    <div
                        className="py-2 px-3 rounded-xl rounded-tl-sm text-xs leading-relaxed break-words"
                        style={{
                            backgroundColor: 'rgba(0, 200, 255, 0.04)',
                            border: '1px solid rgba(0, 200, 255, 0.12)',
                            color: '#e2e8f0',
                            borderLeft: '2px solid #00c8ff'
                        }}
                    >
                        {text}
                    </div>
                </div>
            </div>
        );
    }

    const nameColor = getUsernameColor(author);

    return (
        <div className={`flex items-start gap-2.5 animate-fadeIn group ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            {/* User Avatar */}
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none mt-0.5"
                style={{ background: getAvatarGradient(author) }}
            >
                {author.charAt(0).toUpperCase()}
            </div>

            <div className={`min-w-0 max-w-[85%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-1.5 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                    <span
                        className="font-bold text-xs tracking-tight"
                        style={{ color: isCurrentUser ? '#00c8ff' : nameColor }}
                    >
                        {author}
                    </span>
                    {isCurrentUser && (
                        <span
                            className="text-[9px] font-semibold uppercase px-1 rounded text-white"
                            style={{ backgroundColor: '#0070f3' }}
                        >
                            VOCÊ
                        </span>
                    )}
                    {!isCurrentUser && message.authorChannelId && onBlockClick && (
                        <button
                            onClick={() => onBlockClick(message.authorChannelId!, author)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400"
                            style={{ color: '#3a5a7a' }}
                            title="Bloquear comandos deste usuário"
                        >
                            <ShieldIcon className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <div
                    className={`py-2 px-3 rounded-xl text-xs leading-relaxed break-words shadow-sm ${
                        isCurrentUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
                    }`}
                    style={
                        isCurrentUser
                            ? {
                                  backgroundColor: 'rgba(0, 112, 243, 0.15)',
                                  border: '1px solid rgba(0, 112, 243, 0.35)',
                                  color: '#f8fafc',
                              }
                            : {
                                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid #1a2540',
                                  color: '#cbd5e1',
                              }
                    }
                >
                    {text}
                </div>
            </div>
        </div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, currentUser, small, onBlockUser }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div
            className={`flex-grow ${small ? 'p-3' : 'p-4'} overflow-y-auto custom-scrollbar`}
            style={{ backgroundColor: '#080d18' }}
        >
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center select-none">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #1a2540' }}
                    >
                        <BotIcon className="w-5 h-5" style={{ color: '#3a5a7a' } as any} />
                    </div>
                    <p className="text-xs font-semibold text-white">Nenhuma mensagem no chat</p>
                    <p className="text-[11px] mt-1" style={{ color: '#3a5a7a' }}>
                        Mensagens da live e alertas do bot aparecerão aqui
                    </p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {messages.map((msg, index) => (
                        <MessageItem
                            key={index}
                            message={msg}
                            isCurrentUser={msg.author === currentUser}
                            small={small}
                            onBlockClick={onBlockUser}
                        />
                    ))}
                    <div ref={endOfMessagesRef} />
                </div>
            )}
        </div>
    );
};