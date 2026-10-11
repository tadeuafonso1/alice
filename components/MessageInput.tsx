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

    const activeCommands = [commands.join, commands.leave, commands.position, commands.nick]
        .filter(cmd => cmd && cmd.enabled)
        .map(cmd => cmd.command);

    return (
        <div
            className={`${small ? 'p-2.5' : 'p-3'} flex-shrink-0`}
            style={{
                backgroundColor: '#0d1526',
                borderTop: '1px solid #1a2540'
            }}
        >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={small ? "Mensagem..." : "Digite uma mensagem ou comando..."}
                    className="flex-grow rounded-xl text-xs py-2 px-3 transition-colors outline-none focus:ring-1 focus:ring-cyan-400"
                    style={{
                        backgroundColor: '#080d18',
                        border: '1px solid #1a2540',
                        color: '#f8fafc',
                    }}
                />
                <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 select-none flex-shrink-0"
                    style={{
                        backgroundColor: '#00c8ff',
                        color: '#000d1a',
                    }}
                    onMouseOver={e => {
                        if (text.trim()) e.currentTarget.style.backgroundColor = '#00aada';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = '#00c8ff';
                    }}
                    disabled={!text.trim()}
                >
                    {small ? 'OK' : 'Enviar'}
                </button>
            </form>

            {!small && activeCommands.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                    <span className="font-semibold uppercase tracking-wider" style={{ color: '#2a4060' }}>
                        Comandos:
                    </span>
                    {activeCommands.map(cmd => (
                        <span
                            key={cmd}
                            className="px-1.5 py-0.5 rounded font-mono font-medium"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                color: '#3a5a7a',
                                border: '1px solid rgba(255, 255, 255, 0.04)'
                            }}
                        >
                            {cmd}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};