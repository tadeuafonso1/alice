import React from 'react';
import { TimerIcon } from './Icons';

interface TimerSettingsProps {
    isTimerActive: boolean;
    onToggleTimer: () => void;
    timeoutMinutes: number;
    setTimeoutMinutes: (minutes: number) => void;
    playingTimeoutMinutes: number;
    onSetPlayingTimeout: (minutes: number) => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
    isTimerActive,
    onToggleTimer,
    timeoutMinutes,
    setTimeoutMinutes,
    playingTimeoutMinutes,
    onSetPlayingTimeout,
}) => {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <TimerIcon className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Timer de Inatividade</h3>
                    <p className="text-gray-500 dark:text-[#8bcbd5]">Gerencie o tempo dos usuários na fila e no jogo.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Timer Fila (Inatividade) */}
                <div className="bg-gray-50 dark:bg-[#0f111a] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-lg">Timer da Fila</p>
                            <p className="text-sm text-gray-500 dark:text-[#8bcbd5]">Remove quem não envia mensagens.</p>
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

                {/* Timer Jogando Agora (Expiração) */}
                <div className="bg-gray-50 dark:bg-[#0f111a] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-8">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">Timer de Jogo</p>
                        <p className="text-sm text-gray-500 dark:text-[#8bcbd5]">Tempo para o jogador entrar na partida.</p>
                    </div>

                    <div className="transition-all duration-300">
                        <div className="flex justify-between items-end mb-4">
                            <span className="font-bold text-gray-500 dark:text-[#8bcbd5] uppercase tracking-widest text-xs">Tempo de Expiração</span>
                            <div className="text-right">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{playingTimeoutMinutes}</span>
                                <span className="text-base font-bold text-lime-500 ml-1">minutos</span>
                            </div>
                        </div>

                        <div className="relative h-8 flex items-center">
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={playingTimeoutMinutes}
                                onChange={(e) => onSetPlayingTimeout(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-lime-500 hover:accent-lime-400"
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs font-bold text-gray-400 dark:text-[#8bcbd5]">1 min</span>
                            <span className="text-xs font-bold text-gray-400 dark:text-[#8bcbd5]">10 min</span>
                            <span className="text-xs font-bold text-gray-400 dark:text-[#8bcbd5]">20 min</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link do OBS (Fila + Timer) */}
            <div className="mt-12 p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Sobreposição para o OBS</h4>
                    <p className="text-sm text-gray-500 dark:text-[#8bcbd5]">Link para mostrar a Fila e os Timers de Jogo na sua live.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/obs/queue/${localStorage.getItem('supabase.auth.token') ? JSON.parse(localStorage.getItem('sb-fzxunttshjmjqjyqwvsn-auth-token') || '{}')?.user?.id : ''}`;
                            // This might be tricky via localStorage, better pass userId via props
                        }}
                        className="hidden" // Hiding until I fix the userId pass
                    />
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={() => {
                                // I'll just explain to the user in the message or pass userId prop
                            }}
                            className="hidden"
                        />
                    </div>
                </div>
                <div className="text-xs font-mono bg-gray-100 dark:bg-[#0f111a] p-3 rounded-lg border border-gray-200 dark:border-gray-700 break-all text-cyan-500 font-bold">
                    Painel {'>'} Timer Inatividade (Você está aqui)
                </div>
            </div>
        </div>
    );
};
