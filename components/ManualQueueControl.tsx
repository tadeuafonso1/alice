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
        <div className="bg-[#131b2e] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#162036] border-b border-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    Gerenciamento Manual
                </h3>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight ml-1">YouTube User</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nome do usuário"
                                required
                                className="w-full bg-[#0f111a] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight ml-1">Apelido Jogo (Opcional)</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="E.g. Gamer123"
                                className="w-full bg-[#0f111a] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-30"
                        disabled={!username.trim()}
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        Adicionar à fila agora
                    </button>
                </form>
            </div>
        </div>
    );
};