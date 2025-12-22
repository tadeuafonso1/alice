import React, { useState } from 'react';
import type { CommandSettings } from '../types';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    commands: CommandSettings;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, commands }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
    };

    const displayedCommands = [commands.join, commands.leave, commands.position, commands.nick]
        .filter(cmd => cmd.enabled)
        .map(cmd => cmd.command)
        .join(', ');

    return (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Digite uma mensagem ou comando..."
                    className="flex-grow bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 disabled:opacity-50"
                    disabled={!text.trim()}
                >
                    Enviar
                </button>
            </form>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                Comandos: {displayedCommands}
            </p>
        </div>
    );
};