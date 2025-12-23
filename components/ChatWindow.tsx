import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon } from './Icons';

interface ChatWindowProps {
    messages: Message[];
    currentUser: string;
    small?: boolean;
}

const MessageItem: React.FC<{ message: Message; isCurrentUser: boolean; small?: boolean }> = ({ message, isCurrentUser, small }) => {
    const { author, text, type } = message;

    if (type === 'bot') {
        return (
            <div className={`flex items-start ${small ? 'gap-2' : 'gap-3'}`}>
                <div className={`flex-shrink-0 ${small ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-cyan-100 dark:bg-cyan-800 flex items-center justify-center`}>
                    <BotIcon className={`${small ? 'w-3 h-3' : 'w-5 h-5'} text-cyan-600 dark:text-cyan-300`} />
                </div>
                <div className="min-w-0">
                    <p className={`font-bold text-cyan-600 dark:text-cyan-400 ${small ? 'text-[10px]' : 'text-sm'}`}>{author}</p>
                    <div className={`mt-1 bg-gray-200 dark:bg-gray-700 ${small ? 'py-1 px-3 text-[10px]' : 'py-2 px-4 text-sm'} rounded-lg rounded-tl-none text-gray-700 dark:text-gray-300 break-words`}>
                        {text}
                    </div>
                </div>
            </div>
        );
    }

    const bgColor = isCurrentUser ? 'bg-indigo-600' : 'bg-gray-600 dark:bg-gray-600';
    const authorColor = isCurrentUser ? 'text-indigo-500 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300';
    const roundedClass = isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none';
    const alignment = isCurrentUser ? 'items-end' : 'items-start';

    return (
        <div className={`flex flex-col ${alignment} min-w-0`}>
            <p className={`font-bold ${authorColor} ${small ? 'text-[9px]' : 'text-sm'} px-1`}>{author}</p>
            <div className="flex items-start gap-3 max-w-full">
                <div className={`mt-1 ${bgColor} ${small ? 'py-1 px-3 text-[10px]' : 'py-2 px-4 text-sm'} rounded-lg ${roundedClass} text-white break-words`}>
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
        <div className={`flex-grow ${small ? 'p-3' : 'p-6'} overflow-y-auto custom-scrollbar`}>
            <div className={`${small ? 'space-y-3' : 'space-y-6'}`}>
                {messages.map((msg, index) => (
                    <MessageItem key={index} message={msg} isCurrentUser={msg.author === currentUser} small={small} />
                ))}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};