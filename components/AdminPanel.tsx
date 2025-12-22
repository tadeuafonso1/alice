import React, { useState } from 'react';
import { CrownIcon, RefreshCwIcon, SkipForwardIcon, ChevronDownIcon, ChevronUpIcon, TimerIcon } from './Icons';

interface AdminPanelProps {
    isTimerActive: boolean;
    onToggleTimer: () => void;
    timeoutMinutes: number;
    setTimeoutMinutes: (minutes: number) => void;
    onNext: () => void;
    onReset: () => void;
    isPolling: boolean;
    stopPolling: () => void;
    // Google connection props
    googleConnected: boolean;
    googleEmail: string | null;
    onConnectGoogle: () => void;
    isConnectingGoogle: boolean;
    onDisconnectGoogle: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
    isTimerActive,
    onToggleTimer,
    timeoutMinutes,
    setTimeoutMinutes,
    onNext,
    onReset,
    isPolling,
    stopPolling,
    googleConnected,
    googleEmail,
    onConnectGoogle,
    isConnectingGoogle,
    onDisconnectGoogle,
}) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
                aria-expanded={isOpen}
                aria-controls="admin-panel-content"
            >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CrownIcon className="text-yellow-400" />
                    Controles do Administrador
                </h2>
                {isOpen ? <ChevronUpIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />}
            </button>

            <div
                id="admin-panel-content"
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 pt-0 space-y-6">
                    {/* Conta Google */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Conta Google / YouTube</h3>
                        {googleConnected ? (
                            <div className="space-y-3">
                                {/* Status da conexão */}
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-lime-500/10 to-cyan-500/10 border border-lime-500/30 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <svg className="w-8 h-8" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            {isPolling && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{googleEmail}</p>
                                            <p className="text-xs text-lime-500 flex items-center gap-1">
                                                {isPolling ? (
                                                    <>
                                                        <span className="inline-block w-2 h-2 bg-lime-500 rounded-full animate-pulse"></span>
                                                        Conectado ao chat da live
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                        </svg>
                                                        Conta vinculada
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {isPolling ? (
                                        <button
                                            onClick={stopPolling}
                                            className="px-3 py-1.5 text-sm font-medium text-red-500 hover:text-white hover:bg-red-500 border border-red-500 rounded-md transition-colors"
                                        >
                                            Desconectar Chat
                                        </button>
                                    ) : (
                                        <button
                                            onClick={onDisconnectGoogle}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-500 border border-gray-500 rounded-md transition-colors"
                                            title="Desvincular conta Google"
                                        >
                                            Desvincular
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={onConnectGoogle}
                                disabled={isConnectingGoogle}
                                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                            >
                                {isConnectingGoogle ? (
                                    <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                                ) : (
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                {isConnectingGoogle ? 'Conectando...' : 'Conectar com Google'}
                            </button>
                        )}
                        {!googleConnected && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Conecte sua conta Google para buscar automaticamente suas lives do YouTube.
                            </p>
                        )}
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Timer de Inatividade */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Timer de Inatividade</h3>
                        <div className="flex items-center justify-between">
                            <label htmlFor="timer-toggle" className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" id="timer-toggle" className="sr-only" checked={isTimerActive} onChange={onToggleTimer} />
                                    <div className={`block w-14 h-8 rounded-full transition-colors ${isTimerActive ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className={`dot absolute top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${isTimerActive ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                </div>
                                <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                                    {isTimerActive ? 'Ativado' : 'Desativado'}
                                </div>
                            </label>
                        </div>
                        <div>
                            <label htmlFor="timeoutMinutes" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tempo para remoção (minutos)</label>
                            <div className="relative">
                                <TimerIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                <input
                                    id="timeoutMinutes"
                                    type="number"
                                    value={timeoutMinutes}
                                    onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                                    min="1"
                                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                    disabled={!isTimerActive}
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Ações da Fila */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onNext}
                            className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            <SkipForwardIcon className="w-5 h-5" />
                            Próximo
                        </button>
                        <button
                            onClick={onReset}
                            className="flex items-center justify-center gap-2 bg-red-600 hover:red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                        >
                            <RefreshCwIcon className="w-5 h-5" />
                            Resetar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};