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
    SkipForwardIcon,
    RefreshCwIcon,
    TimerIcon
} from './Icons';

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
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0f111a]">
                <div className="flex flex-col gap-1">
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
                </div>
            </div>
        </aside>
    );
};
