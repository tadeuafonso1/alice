import React, { useState, useRef } from 'react';
import type { CommandSettings } from '../types';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    commands: CommandSettings;
    small?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, commands, small }) => {
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
    };

    const handleCommandClick = (cmd: string) => {
        const valueToSet = cmd.toLowerCase().includes('nick') ? `${cmd} ` : cmd;
        setText(valueToSet);
        inputRef.current?.focus();
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
                    ref={inputRef}
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
                        <button
                            key={cmd}
                            type="button"
                            onClick={() => handleCommandClick(cmd)}
                            title={`Clique para autocompletar ${cmd}`}
                            className="px-2 py-0.5 rounded font-mono font-medium transition-all active:scale-95 cursor-pointer"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.2)'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 200, 255, 0.15)';
                                e.currentTarget.style.color = '#00c8ff';
                                e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.4)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                                e.currentTarget.style.color = '#38bdf8';
                                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                            }}
                        >
                            {cmd}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};