import React, { useState } from 'react';
import type { CommandSettings } from '../types';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    commands: CommandSettings;
    small?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, commands, small }) => {
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
        <div className={`${small ? 'p-3' : 'p-4'} border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md`}>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={small ? "Mensagem..." : "Digite uma mensagem ou comando..."}
                    className={`flex-grow bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl ${small ? 'py-1.5 px-3 text-xs' : 'py-2 px-4 text-sm'} focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 shadow-inner`}
                />
                <button
                    type="submit"
                    className={`bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-bold ${small ? 'py-1.5 px-3 text-[10px]' : 'py-2 px-5 text-sm'} rounded-xl transition duration-200 disabled:opacity-50 uppercase tracking-wider shadow-md shadow-cyan-600/20`}
                    disabled={!text.trim()}
                >
                    {small ? 'OK' : 'Enviar'}
                </button>
            </form>
            {!small && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center font-medium tracking-tight">
                    Comandos: <span className="text-slate-300 dark:text-slate-600 font-normal">{displayedCommands}</span>
                </p>
            )}
        </div>
    );
};