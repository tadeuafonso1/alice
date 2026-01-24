import React, { useState } from 'react';
import {
    BotIcon,
    SettingsIcon,
    MessageSquareIcon,
    LayoutIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    LogOutIcon,
    SunIcon,
    MoonIcon,
    RefreshCwIcon,
    TimerIcon,
    GlobeIcon,
    CopyIcon,
    CrownIcon,
    GiftIcon,
    ThumbsUpIcon,
    RocketIcon,
    UsersIcon,
    AnchorIcon,
    ExternalLinkIcon
} from './Icons';
import { LikeGoalWidget } from './LikeGoalWidget';
import { useSession } from '../src/contexts/SessionContext';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    isOpen,
    setIsOpen,
    theme,
    toggleTheme,
    onSignOut,
}) => {
    const { session } = useSession();
    const userId = session?.user?.id;

    // Menu items configuration
    const menuItems = [
        { id: 'dashboard', label: 'Painel de controle', icon: LayoutIcon },
        { id: 'commands', label: 'Comandos do Bot', icon: MessageSquareIcon },
        { id: 'settings', label: 'Configurações', icon: SettingsIcon },
        {
            id: 'youtube', label: 'YouTube Chat', icon: (props: any) => (
                <svg {...props} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
            )
        },
        { id: 'timer', label: 'Timer Inatividade', icon: TimerIcon },
        { id: 'loyalty', label: 'Lealdade', icon: CrownIcon },
        { id: 'likes', label: 'Contador de Likes', icon: ThumbsUpIcon },
        { id: 'livepix', label: 'Integração LivePix', icon: RocketIcon },
        { id: 'giveaway', label: 'Sorteio', icon: GiftIcon },
    ];

    return (
        <aside
            className={`sticky top-0 h-screen flex-shrink-0 flex flex-col bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 ${isOpen ? 'w-64' : 'w-20'}`}
        >
            {/* Logo Section */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                <div className={`flex items-center gap-3 overflow-hidden ${!isOpen && 'justify-center w-full'}`}>
                    <BotIcon className="w-8 h-8 text-cyan-500 flex-shrink-0" />
                    {isOpen && (
                        <span className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">Alice</span>
                    )}
                </div>
                {isOpen && (
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors hidden md:block text-gray-400"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                )}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="absolute -right-3 top-6 bg-cyan-600 text-white rounded-full p-1 shadow-lg md:flex hidden z-10"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Navigation Section */}
            <div className="flex-grow flex flex-col overflow-y-auto py-4 custom-scrollbar">
                <nav className="space-y-1 mb-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center px-6 py-3 transition-all relative group ${activeTab === item.id
                                ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-r-4 border-cyan-500'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'}`} />
                            {isOpen && (
                                <span className="ml-4 text-sm font-medium whitespace-nowrap">{item.label}</span>
                            )}
                            {!isOpen && (
                                <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0f111a] space-y-2">
                {isOpen && userId && (
                    <div className="mb-4 p-4 rounded-xl bg-lime-500/5 border border-lime-500/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-lime-500 mb-2">Overlay do OBS (Fila + Timer)</p>
                        <div className="flex gap-2">
                            <a
                                href={`/obs/queue/${userId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-lime-600 hover:bg-lime-500 text-white p-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-lime-900/20 active:scale-95"
                            >
                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                                Abrir
                            </a>
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/obs/queue/${userId}`;
                                    navigator.clipboard.writeText(url);
                                    alert('Link do OBS copiado!');
                                }}
                                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-all active:scale-95"
                                title="Copiar Link do OBS"
                            >
                                <CopyIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {isOpen && (
                    <div className="mb-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-2">Página de Comandos</p>
                        <div className="flex gap-2">
                            <a
                                href="/comandos"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
                            >
                                <GlobeIcon className="w-3.5 h-3.5" />
                                Visualizar
                            </a>
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/comandos`;
                                    navigator.clipboard.writeText(url);
                                    alert('Link copiado para a área de transferência!');
                                }}
                                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-all active:scale-95"
                                title="Copiar Link"
                            >
                                <CopyIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {!isOpen && (
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/comandos`;
                            navigator.clipboard.writeText(url);
                        }}
                        className="w-full flex items-center justify-center p-3 text-cyan-500 hover:bg-cyan-500/10 rounded-xl transition-all mb-2"
                        title="Copiar Link de Comandos"
                    >
                        <GlobeIcon className="w-5 h-5" />
                    </button>
                )}

                <div className="flex flex-col gap-1 text-center">
                    <button
                        onClick={onSignOut}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300
                            ${!isOpen && 'justify-center'}
                            `}
                        title="Desconectar"
                    >
                        <LogOutIcon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && <span className="font-bold whitespace-nowrap">Sair do Sistema</span>}
                    </button>

                    {isOpen && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                            <a
                                href="/privacy"
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-cyan-500 transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Política de Privacidade
                            </a>
                            <a
                                href="/terms"
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-cyan-500 transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Termos de Uso
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
