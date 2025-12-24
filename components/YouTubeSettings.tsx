import React from 'react';
import { CrownIcon } from './Icons';

interface YouTubeSettingsProps {
    googleConnected: boolean;
    googleEmail: string | null;
    onConnectGoogle: () => void;
    isConnectingGoogle: boolean;
    onDisconnectGoogle: () => void;
    onFindLiveChat: () => void;
    isFindingChat: boolean;
    isPolling: boolean;
    stopPolling: () => void;
    onReconnectGoogle?: () => void;
}

export const YouTubeSettings: React.FC<YouTubeSettingsProps> = ({
    googleConnected,
    googleEmail,
    onConnectGoogle,
    isConnectingGoogle,
    onDisconnectGoogle,
    onFindLiveChat,
    isFindingChat,
    isPolling,
    stopPolling,
    onReconnectGoogle
}) => {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-500/10 rounded-xl">
                    <svg className="w-8 h-8 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">YouTube Chat</h3>
                    <p className="text-gray-500 dark:text-[#8bcbd5]">Gerencie a conexão com sua transmissão ao vivo.</p>
                </div>
            </div>

            <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="font-semibold text-gray-500 dark:text-[#8bcbd5] uppercase text-xs tracking-wider">
                        Status da Conexão
                    </h3>
                    {googleConnected && (
                        <div className="flex items-center gap-2">
                            {onReconnectGoogle && (
                                <button
                                    onClick={onReconnectGoogle}
                                    className="text-xs text-cyan-500 hover:text-cyan-600 active:scale-95 transition-all font-semibold"
                                >
                                    Reconectar
                                </button>
                            )}
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <button
                                onClick={onDisconnectGoogle}
                                className="text-xs text-red-500 hover:text-red-600 active:scale-95 transition-all font-semibold"
                            >
                                Desconectar
                            </button>
                        </div>
                    )}
                </div>

                {googleConnected ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#0f111a] p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-cyan-500 shadow-md">
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
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-5 w-5 bg-cyan-500 ring-4 ring-gray-50 dark:ring-[#0f111a]"></span>
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 dark:text-white text-lg font-bold truncate">
                                    {googleEmail}
                                </p>
                                <p
                                    className={`text-sm font-medium ${isPolling
                                        ? 'text-cyan-500'
                                        : 'text-gray-500'
                                        } flex items-center gap-2 mt-1`}
                                >
                                    {isPolling ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                            Chat Ativo e Sincronizado
                                        </>
                                    ) : (
                                        'Conectado e Pronto'
                                    )}
                                </p>
                                {/* Added link for reconnection hint if not polling */}
                                {!isPolling && onReconnectGoogle && (
                                    <p className="text-[10px] text-gray-400 mt-1 cursor-pointer hover:underline" onClick={onReconnectGoogle}>
                                        Problemas na conexão? Clique aqui.
                                    </p>
                                )}
                            </div>
                        </div>

                        {isPolling ? (
                            <button
                                onClick={stopPolling}
                                className="w-full py-4 text-red-500 hover:text-white hover:bg-red-500 border-2 border-red-500/20 hover:border-red-500 active:scale-90 active:brightness-110 rounded-full transition-all font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                            >
                                Parar Sincronização
                            </button>
                        ) : (
                            <button
                                onClick={onFindLiveChat}
                                disabled={isFindingChat}
                                className="w-full py-4 text-white bg-cyan-600 hover:bg-cyan-500 active:scale-90 active:brightness-110 disabled:scale-100 disabled:opacity-50 rounded-full transition-all font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/20"
                            >
                                {isFindingChat
                                    ? 'Buscando Live...'
                                    : 'Conectar ao Chat ao Vivo'}
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={onConnectGoogle}
                        disabled={isConnectingGoogle}
                        className="w-full py-8 px-6 bg-gray-50 dark:bg-[#0f111a] border-2 border-dashed border-gray-300 dark:border-gray-700 active:scale-95 active:bg-gray-200 dark:active:bg-gray-800/50 disabled:scale-100 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex flex-col items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CrownIcon className="w-6 h-6 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-900 dark:text-white text-lg font-bold mb-1">Vincular Conta do YouTube</p>
                            <p className="text-gray-500 dark:text-[#8bcbd5] text-sm">Necessário para ler o chat da live automaticamente.</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};
