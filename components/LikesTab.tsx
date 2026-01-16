import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUpIcon, RefreshCwIcon, AlertTriangleIcon, CopyIcon, LinkIcon, SettingsIcon, CheckIcon, PaletteIcon } from './Icons';
import { useSession } from '../src/contexts/SessionContext';

export const LikesTab: React.FC = () => {
    const { session } = useSession();
    const [likes, setLikes] = useState<number>(0);
    const [goal, setGoal] = useState<number>(100);
    const [step, setStep] = useState<number>(50);
    const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [streamFound, setStreamFound] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [lastServerGoal, setLastServerGoal] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // Customization State
    const [barColor, setBarColor] = useState<string>('#2563eb');
    const [bgColor, setBgColor] = useState<string>('#ffffff1a');
    const [borderColor, setBorderColor] = useState<string>('#ffffffcc');
    const [textColor, setTextColor] = useState<string>('#ffffff');

    const obsUrl = session ? `${window.location.origin}/obs/likes/${session.user.id}` : '';

    const fetchLikes = async () => {
        console.log("[LikesTab] fetchLikes triggered");
        console.log("[LikesTab] Session user ID:", session?.user?.id);
        if (!isInitialized) setLoading(true);
        setError(null);
        try {
            console.log("[LikesTab] Invoking Edge Function...");
            const { data, error } = await supabase.functions.invoke('youtube-stats-fetch', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            console.log("[LikesTab] Function result:", { data, error });
            if (error) throw error;

            if (data && data.debug) {
                console.log("[LikesTab] Received debugInfo:", data.debug);
                setDebugInfo({ ...data.debug, version: data.version });
            } else if (data && data.version) {
                setDebugInfo({ version: data.version });
            }

            if (data.error) throw new Error(data.error);

            if (data.streamFound === false) {
                setStreamFound(false);
            } else {
                setStreamFound(true);
            }

            setLikes(data.likes || 0);

            // Logic to prevent overwriting user changes while typing:
            // 1. If it's the first load (!isInitialized), set everything.
            // 2. If the server says the goal was auto-updated (data.goalUpdated), accept the new goal.
            // 3. Otherwise, do NOT overwrite 'goal', 'step', or 'autoUpdate' from the poll, 
            //    because the user might be editing them locally and we don't want to revert their changes.

            if (!isInitialized) {
                if (data.goal) {
                    setGoal(data.goal);
                    setLastServerGoal(data.goal);
                }
                if (data.step) setStep(data.step);
                if (data.auto_update !== undefined) setAutoUpdate(data.auto_update);
            } else if (data.goalUpdated) {
                // Server auto-incremented the goal, so we must sync.
                if (data.goal) {
                    setGoal(data.goal);
                    setLastServerGoal(data.goal);
                }
            } else if (data.goalUpdated) {
                // Server auto-incremented the goal, so we must sync.
                if (data.goal) {
                    setGoal(data.goal);
                    setLastServerGoal(data.goal);
                }
            } else {
                // Optional: If we want to sync across tabs, we could check if data.goal != lastServerGoal
                // But for now, let's prioritize "Don't Overwrite Input".
            }

            // Sync colors if available (and only on first load to avoiding jumping inputs)
            if (!isInitialized && data.colors) {
                setBarColor(data.colors.bar || '#2563eb');
                setBgColor(data.colors.bg || '#ffffff1a');
                setBorderColor(data.colors.border || '#ffffffcc');
                setTextColor(data.colors.text || '#ffffff');
            }

        } catch (err: any) {
            console.error('[LikesTab] Fetch error:', err);
            setDebugInfo(prev => ({ ...prev, catchError: err.message }));
            if (err.message === 'YOUTUBE_TOKEN_EXPIRED') {
                setError('Token expirado. Reconecte o YouTube na aba "YouTube Chat".');
            } else {
                // Keep silent on minor errors unless critical
            }
        } finally {
            setLoading(false);
            setIsInitialized(true);
        }
    };

    const saveSettings = async () => {
        if (!session || !isInitialized) return;
        setIsSaving(true);
        setSaveError(null);
        console.log("Saving Settings via Edge Function:", { goal, step, autoUpdate });

        try {
            const { data, error } = await supabase.functions.invoke('youtube-stats-fetch', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: {
                    goal: goal,
                    step: step,

                    auto_update: autoUpdate,
                    bar_color: barColor,
                    bg_color: bgColor,
                    border_color: borderColor,
                    text_color: textColor
                }
            });

            if (error) throw error;
            if (data && data.error) throw new Error(data.error);

        } catch (err: any) {
            console.error('Error saving settings', err);
            setSaveError(err.message || 'Unknown error');
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    // Auto-save removed as per user request. 
    // Settings now only save when the button is clicked.

    useEffect(() => {
        console.log("[LikesTab] Component mounted, calling fetchLikes");
        fetchLikes();
        const interval = setInterval(() => {
            console.log("[LikesTab] Interval triggered, calling fetchLikes");
            fetchLikes();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const progress = Math.min((likes / goal) * 100, 100);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] p-6 overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <span className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500">
                        <ThumbsUpIcon className="w-8 h-8" />
                    </span>
                    Contador de Likes
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 ml-16">
                    Gerencie a meta de likes e configure o overlay para o OBS.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Preview Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-red-500 mb-6 flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 opacity-70" />
                        Preview da Meta (v1.5)
                    </h3>

                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center border border-slate-700 shadow-xl">
                        <div className="relative z-10">
                            <h4 className="text-cyan-400 font-bold uppercase tracking-widest text-sm mb-2">META DE LIKES</h4>
                            <div className="flex items-baseline justify-center gap-2 mb-4">
                                <span className="text-5xl font-black text-white">{likes.toLocaleString()}</span>
                                <span className="text-xl font-medium text-slate-500">/ {goal.toLocaleString()}</span>
                            </div>

                            <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
                                <div
                                    className="h-full transition-all duration-700"
                                    style={{ width: `${progress}%`, backgroundColor: barColor, boxShadow: `0 0 10px ${barColor}66` }}
                                />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: textColor }}>LIKE {likes.toLocaleString()} / {goal.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-mono rounded-lg overflow-x-auto">
                        <p className="whitespace-nowrap">
                            DEBUG: {debugInfo ? JSON.stringify(debugInfo) : 'WAITING_FOR_DATA'}
                            {debugInfo && debugInfo.version && <span className="ml-2 text-cyan-500">| FN_VER: {debugInfo.version}</span>}
                            {!debugInfo?.version && <span className="ml-2 text-red-500">| FN_VER: OLD/UNKNOWN</span>}
                        </p>
                    </div>

                    {!streamFound && !error && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangleIcon className="w-4 h-4" />
                            Nenhuma live ativa detectada no momento.
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangleIcon className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={fetchLikes}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium text-sm"
                        >
                            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar Agora
                        </button>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5 opacity-70" />
                            Configurações
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex justify-between">
                                    <span>Meta Atual</span>
                                    {isSaving && <span className="text-xs text-cyan-500 animate-pulse">Salvando...</span>}
                                </label>
                                <input
                                    type="number"
                                    value={goal}
                                    onChange={(e) => setGoal(Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Passo (Incremento Automático)</label>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        value={step}
                                        onChange={(e) => setStep(Number(e.target.value))}
                                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <input
                                            type="checkbox"
                                            id="autoUpdateMeta"
                                            checked={autoUpdate}
                                            onChange={(e) => setAutoUpdate(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <label htmlFor="autoUpdateMeta" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                            Auto-Incrementar
                                        </label>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Se ativado, a meta aumentará automaticamente em {step} likes sempre que for atingida.
                                </p>
                            </div>

                            {saveError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                                    Erro ao salvar: {saveError}
                                </div>
                            )}

                            {/* Customization Section */}
                            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <PaletteIcon className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">Personalização Visual</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-xs font-medium text-slate-500 mb-2 group-hover:text-cyan-500 transition-colors">Cor da Barra</label>
                                        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 transition-colors">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
                                                <input
                                                    type="color"
                                                    value={barColor}
                                                    onChange={(e) => setBarColor(e.target.value)}
                                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                                />
                                            </div>
                                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 uppercase">{barColor}</span>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-medium text-slate-500 mb-2 group-hover:text-cyan-500 transition-colors">Cor de Fundo</label>
                                        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 transition-colors">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
                                                <input
                                                    type="color"
                                                    value={bgColor.substring(0, 7)}
                                                    onChange={(e) => setBgColor(e.target.value + '1a')}
                                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                                />
                                            </div>
                                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 uppercase">{bgColor.substring(0, 7)}</span>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-medium text-slate-500 mb-2 group-hover:text-cyan-500 transition-colors">Borda</label>
                                        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 transition-colors">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
                                                <input
                                                    type="color"
                                                    value={borderColor.substring(0, 7)}
                                                    onChange={(e) => setBorderColor(e.target.value + 'cc')}
                                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                                />
                                            </div>
                                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 uppercase">{borderColor.substring(0, 7)}</span>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-medium text-slate-500 mb-2 group-hover:text-cyan-500 transition-colors">Texto</label>
                                        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 transition-colors">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
                                                <input
                                                    type="color"
                                                    value={textColor}
                                                    onChange={(e) => setTextColor(e.target.value)}
                                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                                />
                                            </div>
                                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 uppercase">{textColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <button
                                onClick={saveSettings}
                                disabled={isSaving}
                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                            </button>
                        </div>
                    </div>

                    {/* OBS Link Card */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                            <LinkIcon className="w-5 h-5" />
                            Integração com OBS
                        </h3>
                        <p className="text-slate-300 text-sm mb-4 relative z-10">
                            Copie o link abaixo e adicione como uma <strong>Fonte de Navegador (Browser Source)</strong> no seu OBS.
                        </p>

                        <div className="flex gap-2 relative z-10">
                            <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-cyan-300 truncate">
                                {obsUrl}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(obsUrl);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`p-3 rounded-lg transition-all font-bold shadow-lg flex items-center justify-center gap-2 ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-cyan-500 hover:bg-cyan-400'} text-white`}
                                title="Copiar Link"
                            >
                                {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                                {copied && <span className="text-xs">Copiado!</span>}
                            </button>
                        </div>
                        <div className="mt-4 flex gap-4 text-xs text-slate-400 relative z-10">
                            <div className="text-center">
                                <span className="block font-bold text-white mb-1">Largura</span>
                                600px
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-white mb-1">Altura</span>
                                200px
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
