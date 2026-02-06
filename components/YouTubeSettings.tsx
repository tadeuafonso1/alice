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
        <div className="bg-[#0f1421] dark:bg-[#0f1421] rounded-xl shadow-xl p-4 border border-white/5">
            <div className="space-y-2 max-w-full">
                {/* Connection Account Card */}
                <div className="flex items-center gap-2 bg-[#0a0d14] p-2.5 rounded-lg border border-white/5 shadow-inner">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0a0d14] ring-1 ring-cyan-500/20">
                            <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center p-1.5 ring-1 ring-white/5">
                                <svg className="w-full h-full" viewBox="0 0 24 24">
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
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold tracking-tight truncate">
                            {googleEmail || 'Conta não conectada'}
                        </p>
                        <p className="text-gray-500 text-[9px] font-medium">
                            {isPolling ? 'Ao vivo agora' : 'Conectado e Pronto'}
                        </p>
                    </div>
                    <button
                        onClick={onReconnect}
                        className="p-1 text-gray-500 hover:text-white transition-all bg-white/5 rounded-md hover:bg-white/10"
                        title="Reconectar"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Main Action Button */}
                <button
                    onClick={isPolling ? stopPolling : onFindLiveChat}
                    disabled={isFindingChat}
                    className={`w-full py-2.5 rounded-lg transition-all font-black uppercase tracking-widest text-[9px] shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isPolling
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/10'
                        : 'bg-[#10b981] hover:bg-[#059669] text-white shadow-emerald-500/10'
                        }`}
                >
                    {isFindingChat ? 'Buscando...' : isPolling ? 'PARAR SINCRONIZAÇÃO' : 'CONECTAR AO CHAT AO VIVO'}
                </button>

                {/* Auto Sync Toggle Card */}
                <div className="flex items-center justify-between p-2.5 bg-[#0a0d14] rounded-lg border border-white/5 shadow-inner">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#1e2230] rounded-md ring-1 ring-white/5">
                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white tracking-tight">Busca Automática</p>
                            <p className="text-[8px] text-gray-500 font-medium">Auto-verificação a cada 15 min.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoSyncEnabled}
                            onChange={(e) => onToggleAutoSync(e.target.checked)}
                        />
                        <div className="w-7 h-3.5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all dark:border-gray-600 peer-checked:bg-white"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};
