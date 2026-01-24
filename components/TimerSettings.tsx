import React from 'react';
import { TimerIcon } from './Icons';

interface TimerSettingsProps {
    isTimerActive: boolean;
    onToggleTimer: () => void;
    timeoutMinutes: number;
    setTimeoutMinutes: (minutes: number) => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
    isTimerActive,
    onToggleTimer,
    timeoutMinutes,
    setTimeoutMinutes,
}) => {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <TimerIcon className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Timer de Inatividade</h3>
                    <p className="text-gray-500 dark:text-[#8bcbd5]">Remova usuários inativos da fila automaticamente.</p>
                </div>
            </div>

            <div className="max-w-xl">
                {/* Timer Fila (Inatividade) */}
                <div className="bg-gray-50 dark:bg-[#0f111a] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-lg">Timer da Fila</p>
                            <p className="text-sm text-gray-500 dark:text-[#8bcbd5]">Remove quem não envia mensagens pelo chat.</p>
                        </div>
                        <button
                            onClick={onToggleTimer}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${isTimerActive ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isTimerActive ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className={`transition-all duration-300 ${isTimerActive ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="flex justify-between items-end mb-4">
                            <span className="font-bold text-gray-500 dark:text-[#8bcbd5] uppercase tracking-widest text-xs">Tempo Limite</span>
                            <div className="text-right">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{timeoutMinutes}</span>
                                <span className="text-base font-bold text-cyan-500 ml-1">minutos</span>
                            </div>
                        </div>

                        <div className="relative h-8 flex items-center">
                            <input
                                type="range"
                                min="1"
                                max="30"
                                step="1"
                                disabled={!isTimerActive}
                                value={timeoutMinutes}
                                onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs font-bold text-gray-400 dark:text-[#8bcbd5]">1 min</span>
                            <span className="text-xs font-bold text-gray-400 dark:text-[#8bcbd5]">30 min</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
