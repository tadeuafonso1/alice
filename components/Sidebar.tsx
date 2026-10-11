import React from 'react';
import {
    SettingsIcon,
    MessageSquareIcon,
    LayoutIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    LogOutIcon,
    TimerIcon,
    GlobeIcon,
    CopyIcon,
    ThumbsUpIcon,
    YoutubeIcon,
    ShieldIcon
} from './Icons';
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

const menuItems = [
    { id: 'dashboard', label: 'Painel de Controle', icon: LayoutIcon },
    { id: 'commands', label: 'Comandos do Bot', icon: MessageSquareIcon },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
    { id: 'youtube', label: 'YouTube Chat', icon: YoutubeIcon },
    { id: 'timer', label: 'Timer de Inatividade', icon: TimerIcon },
    { id: 'likes', label: 'Contador de Likes', icon: ThumbsUpIcon },
    { id: 'blocked', label: 'Usuários Bloqueados', icon: ShieldIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    isOpen,
    setIsOpen,
    onSignOut,
}) => {
    const { session } = useSession();

    return (
        <aside
            style={{ backgroundColor: '#0a0e1a', borderRight: '1px solid #131d35' }}
            className={`sticky top-0 h-screen flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-60' : 'w-[72px]'}`}
        >
            {/* ── Logo / Brand ── */}
            <div
                style={{ borderBottom: '1px solid #131d35', height: '64px' }}
                className={`flex items-center flex-shrink-0 ${isOpen ? 'px-5 justify-between' : 'justify-center'}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Gradient "A" monogram */}
                    <div
                        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white select-none"
                        style={{ background: 'linear-gradient(135deg, #00c8ff 0%, #0070f3 100%)', boxShadow: '0 0 16px rgba(0,200,255,0.3)' }}
                    >
                        A
                    </div>
                    {isOpen && (
                        <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                            Alice <span style={{ color: '#00c8ff' }}>Bot</span>
                        </span>
                    )}
                </div>

                {isOpen && (
                    <button
                        onClick={() => setIsOpen(false)}
                        title="Recolher menu"
                        style={{ color: '#3a5070' }}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-grow py-3 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 px-2">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={!isOpen ? item.label : undefined}
                            className={`relative group w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${
                                isOpen ? 'px-3 py-2.5' : 'justify-center py-3'
                            } ${
                                isActive
                                    ? 'text-white'
                                    : 'hover:text-white'
                            }`}
                            style={isActive ? {
                                backgroundColor: 'rgba(0,200,255,0.08)',
                                color: '#ffffff',
                            } : {
                                color: '#3a5a7a',
                            }}
                        >
                            {/* Active left accent bar */}
                            {isActive && (
                                <span
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                                    style={{ backgroundColor: '#00c8ff' }}
                                />
                            )}

                            <item.icon
                                className="w-5 h-5 flex-shrink-0 transition-colors"
                                style={{ color: isActive ? '#00c8ff' : undefined }}
                            />

                            {isOpen && (
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip when collapsed */}
                            {!isOpen && (
                                <div
                                    className="absolute left-14 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 shadow-xl"
                                    style={{
                                        backgroundColor: '#1a2540',
                                        color: '#e0eaff',
                                        border: '1px solid #253560',
                                    }}
                                >
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ── Bottom Section ── */}
            <div style={{ borderTop: '1px solid #131d35' }} className="flex-shrink-0">
                {isOpen ? (
                    <div className="p-3 flex flex-col gap-2">
                        {/* Commands page shortcut */}
                        <div
                            className="p-3 rounded-xl flex flex-col gap-2"
                            style={{ backgroundColor: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.08)' }}
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#00c8ff' }}>
                                Página de Comandos
                            </p>
                            <div className="flex gap-2">
                                <a
                                    href="/comandos"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-bold py-1.5 rounded-lg transition-all active:scale-95"
                                    style={{ backgroundColor: '#0070f3' }}
                                    onMouseOver={e => (e.currentTarget.style.backgroundColor = '#0060d3')}
                                    onMouseOut={e => (e.currentTarget.style.backgroundColor = '#0070f3')}
                                >
                                    <GlobeIcon className="w-3.5 h-3.5" />
                                    Visualizar
                                </a>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/comandos`);
                                        alert('Link copiado!');
                                    }}
                                    title="Copiar link"
                                    className="p-1.5 rounded-lg transition-all active:scale-95"
                                    style={{ backgroundColor: '#1a2540', color: '#4a7090' }}
                                    onMouseOver={e => (e.currentTarget.style.color = '#00c8ff')}
                                    onMouseOut={e => (e.currentTarget.style.color = '#4a7090')}
                                >
                                    <CopyIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Sign out */}
                        <button
                            onClick={onSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                            style={{ color: '#ff4d4d' }}
                            onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(255,77,77,0.08)')}
                            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <LogOutIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-semibold">Sair do Sistema</span>
                        </button>

                        {/* Legal links */}
                        <div className="flex gap-3 px-1">
                            <a href="/privacy" target="_blank" rel="noopener noreferrer"
                                className="text-[10px] font-semibold uppercase tracking-wider transition-colors"
                                style={{ color: '#2a4060' }}
                                onMouseOver={e => (e.currentTarget.style.color = '#00c8ff')}
                                onMouseOut={e => (e.currentTarget.style.color = '#2a4060')}
                            >
                                Privacidade
                            </a>
                            <a href="/terms" target="_blank" rel="noopener noreferrer"
                                className="text-[10px] font-semibold uppercase tracking-wider transition-colors"
                                style={{ color: '#2a4060' }}
                                onMouseOver={e => (e.currentTarget.style.color = '#00c8ff')}
                                onMouseOut={e => (e.currentTarget.style.color = '#2a4060')}
                            >
                                Termos
                            </a>
                        </div>
                    </div>
                ) : (
                    /* Collapsed bottom icons */
                    <div className="flex flex-col items-center gap-1 py-3 px-2">
                        <button
                            onClick={() => setIsOpen(true)}
                            title="Expandir menu"
                            className="w-full flex items-center justify-center p-2.5 rounded-lg transition-all group"
                            style={{ color: '#3a5070' }}
                            onMouseOver={e => (e.currentTarget.style.color = '#00c8ff')}
                            onMouseOut={e => (e.currentTarget.style.color = '#3a5070')}
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/comandos`);
                            }}
                            title="Copiar Link de Comandos"
                            className="w-full flex items-center justify-center p-2.5 rounded-lg transition-all"
                            style={{ color: '#3a5070' }}
                            onMouseOver={e => (e.currentTarget.style.color = '#00c8ff')}
                            onMouseOut={e => (e.currentTarget.style.color = '#3a5070')}
                        >
                            <GlobeIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onSignOut}
                            title="Sair do Sistema"
                            className="w-full flex items-center justify-center p-2.5 rounded-lg transition-all"
                            style={{ color: '#3a5070' }}
                            onMouseOver={e => (e.currentTarget.style.color = '#ff4d4d')}
                            onMouseOut={e => (e.currentTarget.style.color = '#3a5070')}
                        >
                            <LogOutIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};
