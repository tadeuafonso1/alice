import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon } from './Icons';

interface ChatWindowProps {
    messages: Message[];
    currentUser: string;
    small?: boolean;
}

const TWITCH_COLORS = [
    '#FF69B4', // HotPink
    '#1E90FF', // DodgerBlue
    '#2E8B57', // SeaGreen
    '#FF4500', // OrangeRed
    '#9ACD32', // YellowGreen
    '#8A2BE2', // BlueViolet
    '#5F9EA0', // CadetBlue
    '#D2691E', // Chocolate
    '#FFD700', // Gold
    '#FF7F50', // Coral
    '#00FF7F', // SpringGreen
    '#00CED1', // DarkTurquoise
];

const getUsernameColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TWITCH_COLORS.length;
    return TWITCH_COLORS[index];
};

const MessageItem: React.FC<{ message: Message; isCurrentUser: boolean; small?: boolean }> = ({ message, isCurrentUser, small }) => {
    const { author, text, type } = message;

    if (type === 'bot') {
        return (
            <div className={`flex items-start ${small ? 'gap-2' : 'gap-3'} animate-fadeIn`}>
                <div className={`flex-shrink-0 ${small ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-cyan-100/80 dark:bg-cyan-900/50 flex items-center justify-center border border-cyan-200 dark:border-cyan-800 shadow-sm`}>
                    <BotIcon className={`${small ? 'w-3 h-3' : 'w-5 h-5'} text-cyan-600 dark:text-cyan-300`} />
                </div>
                <div className="min-w-0">
                    <p className={`font-bold text-cyan-500 dark:text-cyan-400 ${small ? 'text-[10px]' : 'text-[13px]'} tracking-tight`}>{author}</p>
                    <div className={`mt-1 bg-white/70 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 ${small ? 'py-1 px-3 text-[11px]' : 'py-2 px-4 text-[14px]'} rounded-xl rounded-tl-none shadow-sm text-slate-700 dark:text-slate-200 break-words leading-relaxed`}>
                        {text}
                    </div>
                </div>
            </div>
        );
    }

    const nameColor = getUsernameColor(author);
    const bubbleBg = isCurrentUser ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800/60 shadow-slate-900/5';
    const textColor = isCurrentUser ? 'text-white' : 'text-slate-700 dark:text-slate-200';
    const borderColor = isCurrentUser ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-700/50';
    const alignment = isCurrentUser ? 'items-end' : 'items-start';
    const roundedClass = isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none';

    return (
        <div className={`flex flex-col ${alignment} min-w-0 animate-fadeIn`}>
            <p
                className={`font-bold ${small ? 'text-[10px]' : 'text-[13px]'} px-1 mb-1 tracking-tight`}
                style={{ color: isCurrentUser ? undefined : nameColor }}
            >
                {author}
            </p>
            <div className={`flex items-start gap-3 max-w-full`}>
                <div className={`border ${bubbleBg} ${borderColor} ${small ? 'py-1 px-3 text-[11px]' : 'py-2 px-4 text-[14px]'} rounded-xl ${roundedClass} ${textColor} break-words shadow-sm leading-relaxed`}>
                    {text}
                </div>
            </div>
        </div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, currentUser, small }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className={`flex-grow ${small ? 'p-3' : 'p-6'} overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20`}>
            <div className={`${small ? 'space-y-4' : 'space-y-6'}`}>
                {messages.map((msg, index) => (
                    <MessageItem key={index} message={msg} isCurrentUser={msg.author === currentUser} small={small} />
                ))}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};