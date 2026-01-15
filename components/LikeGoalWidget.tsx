import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SettingsIcon, ThumbsUpIcon, RefreshCwIcon, AlertTriangleIcon } from './Icons';

interface LikeGoalWidgetProps {
    isOpen: boolean; // Sidebar state
}

export const LikeGoalWidget: React.FC<LikeGoalWidgetProps> = ({ isOpen }) => {
    const [likes, setLikes] = useState<number>(0);
    const [goal, setGoal] = useState<number>(100); // Default start goal
    const [step, setStep] = useState<number>(50); // Default step
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [streamFound, setStreamFound] = useState<boolean>(true);

    // Configurable Auto-Goal
    const [autoUpdate, setAutoUpdate] = useState<boolean>(true);

    const fetchLikes = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase.functions.invoke('youtube-stats-fetch', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            if (data.streamFound === false) {
                setStreamFound(false);
                setLoading(false);
                return;
            }

            setStreamFound(true);
            const currentLikes = data.likes;
            setLikes(currentLikes);

            // Auto-Goal Logic
            if (autoUpdate && currentLikes >= goal) {
                // Calculate how many steps we missed if it jumped a lot
                const diff = currentLikes - goal;
                const stepsToAdd = Math.floor(diff / step) + 1;
                const newGoal = goal + (step * stepsToAdd);

                setGoal(newGoal);

                // Optional: Play sound or visual effect here
                // const audio = new Audio('/success.mp3');
                // audio.play().catch(() => {}); 
            }

        } catch (err: any) {
            console.error('Error fetching likes:', err);
            if (err.message === 'YOUTUBE_TOKEN_EXPIRED') {
                setError('Token expirado. Reconecte o YouTube.');
            } else {
                setError('Erro ao buscar likes.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Poll every 60 seconds
    useEffect(() => {
        fetchLikes(); // Initial fetch
        const interval = setInterval(fetchLikes, 60000);
        return () => clearInterval(interval);
    }, [goal, step, autoUpdate]); // Depend on goal/step so next tick uses current values

    // Progress percentage
    const progress = Math.min((likes / goal) * 100, 100);

    if (!isOpen) {
        // Compact view for closed sidebar
        return (
            <div className="flex flex-col items-center justify-center p-2 text-cyan-500" title={`Meta de Likes: ${likes}/${goal}`}>
                <ThumbsUpIcon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">{likes}</span>
                <div className="w-full h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div
                        className="h-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 mx-2 mt-auto mb-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <ThumbsUpIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Meta de Likes</span>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 transition-colors"
                >
                    <SettingsIcon className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Main Display */}
            <div className="mb-3">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-2xl font-black text-gray-800 dark:text-white transition-all">
                        {likes.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        / {goal.toLocaleString()}
                    </span>
                </div>

                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Status / Error */}
            {!streamFound && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-[10px] bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded mb-2">
                    <AlertTriangleIcon className="w-3 h-3 flex-shrink-0" />
                    <span>Nenhuma live ativa encontrada.</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] bg-red-50 dark:bg-red-900/20 p-2 rounded mb-2">
                    <AlertTriangleIcon className="w-3 h-3 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Manual Refresh Button */}
            <button
                onClick={fetchLikes}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/10 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
            >
                <RefreshCwIcon className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Atualizando...' : 'Atualizar Agora'}
            </button>

            {/* Settings Extension */}
            {showSettings && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-1">
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Meta Atual</label>
                        <input
                            type="number"
                            value={goal}
                            onChange={(e) => setGoal(Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Passo (Incremento)</label>
                        <input
                            type="number"
                            value={step}
                            onChange={(e) => setStep(Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="autoUpdate"
                            checked={autoUpdate}
                            onChange={(e) => setAutoUpdate(e.target.checked)}
                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <label htmlFor="autoUpdate" className="text-xs text-gray-600 dark:text-gray-300">Atualizar meta automaticamente</label>
                    </div>
                </div>
            )}
        </div>
    );
};
