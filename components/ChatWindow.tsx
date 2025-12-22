import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon } from './Icons';

interface ChatWindowProps {
    messages: Message[];
    currentUser: string;
}

const MessageItem: React.FC<{ message: Message; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
    const { author, text, type } = message;
    
    if (type === 'bot') {
        return (
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-800 flex items-center justify-center">
                    <BotIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div>
                    <p className="font-bold text-cyan-600 dark:text-cyan-400">{author}</p>
                    <div className="mt-1 bg-gray-200 dark:bg-gray-700 py-2 px-4 rounded-lg rounded-tl-none text-gray-700 dark:text-gray-300 break-words">
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
    const nameAlignment = isCurrentUser ? 'text-right' : 'text-left';

    return (
        <div className={`flex flex-col ${alignment}`}>
             <p className={`font-bold ${authorColor} text-sm px-1`}>{author}</p>
             <div className="flex items-start gap-3 max-w-md">
                <div className={`mt-1 ${bgColor} py-2 px-4 rounded-lg ${roundedClass} text-white break-words`}>
                   {text}
                </div>
            </div>
        </div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, currentUser }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    return (
        <div className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-6">
                {messages.map((msg, index) => (
                    <MessageItem key={index} message={msg} isCurrentUser={msg.author === currentUser} />
                ))}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};