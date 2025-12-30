import React from 'react';
import { CrownIcon, SettingsIcon, UsersIcon, RefreshCwIcon } from './Icons';

interface LoyaltySettingsProps {
    loyaltySettings: {
        pointsPerInterval: number;
        intervalMinutes: number;
        enabled: boolean;
    };
    onSaveSettings: (settings: any) => void;
    onResetPoints: () => void;
    onAddPoints: (username: string, points: number) => void;
}

export const LoyaltySettings: React.FC<LoyaltySettingsProps> = ({
    loyaltySettings,
    onSaveSettings,
    onResetPoints,
    onAddPoints,
}) => {
    const [manualUser, setManualUser] = React.useState('');
    const [manualPoints, setManualPoints] = React.useState(0);
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white relative">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Sistema de Lealdade</h3>
                    <p className="text-amber-100 opacity-90">Recompense seus espectadores por acompanharem a live.</p>
                </div>
                <CrownIcon className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Card */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Manual Points Form */}
                    <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <UsersIcon className="w-5 h-5 text-cyan-500" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Ajuste Manual</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Usuário</label>
                                <input
                                    type="text"
                                    value={manualUser}
                                    onChange={(e) => setManualUser(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                    placeholder="Ex: joao_silva"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pontos (pode ser negativo)</label>
                                <input
                                    type="number"
                                    value={manualPoints}
                                    onChange={(e) => setManualPoints(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (!manualUser) return alert('Digite o nome do usuário');
                                    onAddPoints(manualUser, manualPoints);
                                    setManualUser('');
                                    setManualPoints(0);
                                }}
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
                            >
                                Adicionar Pontos
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <SettingsIcon className="w-5 h-5 text-amber-500" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Configuração</h4>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pontos</label>
                                <input
                                    type="number"
                                    value={loyaltySettings.pointsPerInterval}
                                    onChange={(e) => onSaveSettings({ ...loyaltySettings, pointsPerInterval: Number(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                    placeholder="Ex: 10"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Intervalo (Minutos)</label>
                                <input
                                    type="number"
                                    value={loyaltySettings.intervalMinutes}
                                    onChange={(e) => onSaveSettings({ ...loyaltySettings, intervalMinutes: Number(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                    placeholder="Ex: 10"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => onSaveSettings({ ...loyaltySettings, enabled: !loyaltySettings.enabled })}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${loyaltySettings.enabled
                                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20'
                                        : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {loyaltySettings.enabled ? 'Ativado' : 'Desativado'}
                                </button>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => {
                                        if (confirm('Tem certeza que deseja ZERAR os pontos de TODOS os usuários? Esta ação não pode ser desfeita.')) {
                                            onResetPoints();
                                        }
                                    }}
                                    className="w-full py-2 text-xs font-bold text-red-500 hover:text-white border border-red-500 hover:bg-red-500 rounded-lg transition-all"
                                >
                                    Zerar Todos os Pontos
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl">
                        <p className="text-sm text-amber-800 dark:text-amber-200 opacity-80">
                            Os pontos são atribuídos automaticamente aos usuários que estiverem ativos no chat durante o intervalo definido.
                        </p>
                    </div>
                </div>

                {/* Leaderboard Placeholder */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm h-full flex flex-col">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <UsersIcon className="w-5 h-5 text-amber-500" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Ranking de Lealdade</h4>
                            </div>
                            <button className="p-2 text-gray-400 hover:text-amber-500 transition-colors">
                                <RefreshCwIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-grow p-6 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <CrownIcon className="w-16 h-16 text-gray-300 dark:text-gray-700" />
                            <div>
                                <p className="font-bold text-gray-500 dark:text-gray-400">Nenhum dado de lealdade ainda</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Ative o sistema e aguarde os usuários interagirem.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
