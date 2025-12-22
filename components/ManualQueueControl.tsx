import React, { useState } from 'react';
import { PlusCircleIcon, UserIcon } from './Icons';

interface ManualQueueControlProps {
    onAddUser: (username: string, nickname: string) => void;
}

export const ManualQueueControl: React.FC<ManualQueueControlProps> = ({ onAddUser }) => {
    const [username, setUsername] = useState('');
    const [nickname, setNickname] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onAddUser(username.trim(), nickname.trim());
            setUsername('');
            setNickname('');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserIcon className="text-cyan-500" />
                Gerenciamento Manual da Fila
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome do usuário"
                    required
                    className="flex-grow w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Apelido (opcional)"
                    className="flex-grow w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50"
                    disabled={!username.trim()}
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Adicionar
                </button>
            </form>
        </div>
    );
};