import React from 'react';
import { YoutubeIcon } from './Icons';

interface YouTubeSettingsProps {
    googleConnected: boolean;
    googleEmail: string | null;
    onFindLiveChat: () => void;
    isFindingChat: boolean;
    isPolling: boolean;
    stopPolling: () => void;
    autoSyncEnabled: boolean;
    onToggleAutoSync: (enabled: boolean) => void;
    onReconnect: () => void;
}

export const YouTubeSettings: React.FC<YouTubeSettingsProps> = ({
    googleConnected,
    googleEmail,
    onFindLiveChat,
    isFindingChat,
    isPolling,
    stopPolling,
    autoSyncEnabled,
    onToggleAutoSync,
    onReconnect,
}) => {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-500/10 rounded-xl">
                    <YoutubeIcon className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">YouTube Chat</h3>
                    <p className="text-gray-500 dark:text-[#8bcbd5]">Gerencie a conexão com sua transmissão ao vivo.</p>
                </div>
            </div>

            <div className="space-y-6 max-w-2xl">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#0f111a] p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <div className={`w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-4 ${isPolling ? 'border-emerald-500 shadow-emerald-500/20' : 'border-cyan-500'} shadow-md transition-all`}>
                                <svg className="w-8 h-8" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            </div>
                            {isPolling && (
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 ring-4 ring-gray-50 dark:ring-[#0f111a]"></span>
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-900 dark:text-white text-lg font-bold truncate">
                                {googleEmail || 'Conta Google'}
                            </p>
                            <p
                                className={`text-sm font-medium ${isPolling
                                    ? 'text-emerald-500'
                                    : 'text-gray-500'
                                    } flex items-center gap-2 mt-1`}
                            >
                                {isPolling ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Chat Ativo e Sincronizado
                                    </>
                                ) : (
                                    'Conectado e Pronto'
                                )}
                            </p>
                        </div>
                        <button
                            onClick={onReconnect}
                            className="p-2 text-gray-400 hover:text-cyan-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Reconectar conta Google (corrigir erro 401)"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    {isPolling ? (
                        <button
                            onClick={stopPolling}
                            className="w-full py-4 bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-90 active:brightness-110 rounded-full transition-all font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:hidden" />
                            <span className="hidden group-hover:block">Parar Sincronização</span>
                            <span className="group-hover:hidden">Chat Sincronizado</span>
                        </button>
                    ) : (
                        <button
                            onClick={onFindLiveChat}
                            disabled={isFindingChat}
                            className="w-full py-4 text-white bg-emerald-600 hover:bg-emerald-500 active:scale-90 active:brightness-110 disabled:scale-100 disabled:opacity-50 rounded-full transition-all font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20"
                        >
                            {isFindingChat
                                ? 'Buscando Live...'
                                : 'Conectar ao Chat ao Vivo'}
                        </button>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f111a] rounded-2xl border border-gray-200 dark:border-gray-800 transition-all mt-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${autoSyncEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Busca Automática</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Verifica se você entrou ao vivo a cada 15 min.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={autoSyncEnabled}
                                onChange={(e) => onToggleAutoSync(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
