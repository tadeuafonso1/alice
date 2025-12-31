import React from 'react';
import { AppSettings } from '../types';
import { CrownIcon, SettingsIcon } from './Icons';

interface LoyaltySettingsProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

export const LoyaltySettings: React.FC<LoyaltySettingsProps> = ({ settings, onSave }) => {
    const handleLoyaltyChange = <K extends keyof AppSettings['loyalty']>(key: K, value: AppSettings['loyalty'][K]) => {
        onSave({
            ...settings,
            loyalty: {
                ...settings.loyalty,
                [key]: value
            }
        });
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white relative">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Sistema de Lealdade</h3>
                    <p className="text-amber-100 opacity-90">Recompense seus espectadores por assistirem e interagirem com a live.</p>
                </div>
                <CrownIcon className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />
            </div>

            <div className="space-y-8">
                <section>
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-[#0f111a] rounded-2xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <CrownIcon className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">Habilitar Sistema</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Ative ou desative o acúmulo de pontos globalmente.</p>
                            </div>
                        </div>
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={settings.loyalty.enabled}
                                    onChange={(e) => handleLoyaltyChange('enabled', e.target.checked)}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${settings.loyalty.enabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                <div className={`dot absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${settings.loyalty.enabled ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </section>

                {settings.loyalty.enabled && (
                    <section className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Pontos por Mensagem</label>
                                <input
                                    type="number"
                                    value={settings.loyalty.pointsPerMessage}
                                    onChange={(e) => handleLoyaltyChange('pointsPerMessage', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 italic">Quantos pontos ganhar a cada mensagem enviada.</p>
                            </div>

                            <div className="p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Pontos por Presença</label>
                                <input
                                    type="number"
                                    value={settings.loyalty.pointsPerInterval}
                                    onChange={(e) => handleLoyaltyChange('pointsPerInterval', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 italic">Pontos ganhos periodicamente por assistir.</p>
                            </div>

                            <div className="p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Intervalo (Minutos)</label>
                                <input
                                    type="number"
                                    value={settings.loyalty.intervalMinutes}
                                    onChange={(e) => handleLoyaltyChange('intervalMinutes', parseInt(e.target.value) || 1)}
                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 italic">Frequência do ganho por presença.</p>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-start gap-4">
                            <div className="p-2 bg-white dark:bg-[#1E293B] rounded-lg shadow-sm">
                                <SettingsIcon className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h5 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Dica de Streamer</h5>
                                <p className="text-sm text-amber-800 dark:text-amber-200 opacity-80 leading-relaxed">
                                    Configure o **Custo de Pontos** em cada comando na aba **Comandos do Bot**. Isso permitirá que você cobre pontos para ações específicas como entrar na fila ou participar de sorteios.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
