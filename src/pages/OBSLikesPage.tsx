import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const OBSLikesPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [likes, setLikes] = useState<number>(0);
    const [goal, setGoal] = useState<number>(100);
    const [loading, setLoading] = useState<boolean>(true);

    // Customization State
    const [barColor, setBarColor] = useState<string>('#2563eb');
    const [bgColor, setBgColor] = useState<string>('#ffffff1a');
    const [borderColor, setBorderColor] = useState<string>('#ffffffcc');
    const [textColor, setTextColor] = useState<string>('#ffffff');
    const [streamFound, setStreamFound] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const fetchStats = async (retryCount = 0) => {
        const pathParts = window.location.pathname.split('/');
        const idFromPath = pathParts[pathParts.length - 1];
        const cleanUserId = (idFromPath || userId)?.trim();

        if (!cleanUserId || cleanUserId === 'undefined' || cleanUserId.length < 20) {
            setErrorMsg("Link do OBS incompleto. Copie do Dashboard.");
            setLoading(false);
            return;
        }

        try {
            // DIRECT DB POLL: Most stable way for OBS Browser Source
            const { data, error } = await supabase
                .from('like_goals')
                .select('*')
                .eq('user_id', cleanUserId)
                .maybeSingle();

            if (error) {
                if (retryCount < 2) {
                    setTimeout(() => fetchStats(retryCount + 1), 2000);
                    return;
                }
                setErrorMsg(`Erro de Banco: ${error.message}`);
                return;
            }

            if (data) {
                setErrorMsg(null);
                setLikes(data.current_likes ?? 0);
                setGoal(data.current_goal ?? 100);
                setStreamFound(data.stream_found ?? false);
                setDebugInfo('');

                setBarColor(data.bar_color || '#2563eb');
                setBgColor(data.colors?.bg || data.bg_color || '#ffffff1a');
                setBorderColor(data.colors?.border || data.border_color || '#ffffffcc');
                setTextColor(data.colors?.text || data.text_color || '#ffffff');
            } else {
                setErrorMsg(`Meta não encontrada para o ID: ${cleanUserId.substring(0, 8)}...`);
            }
        } catch (err: any) {
            if (retryCount < 2) {
                setTimeout(() => fetchStats(retryCount + 1), 2000);
                return;
            }
            setErrorMsg(`Erro de Rede: ${err.message}`);
        } finally {
            if (retryCount === 0) setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Poll every 30s to be slightly faster for OBS visual
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    // Force transparent background on body/html for OBS
    // Force transparent background on body/html for OBS
    useEffect(() => {
        const root = document.getElementById('root');

        document.body.classList.add('bg-transparent-important');
        document.documentElement.classList.add('bg-transparent-important');
        if (root) root.classList.add('bg-transparent-important');

        return () => {
            document.body.classList.remove('bg-transparent-important');
            document.documentElement.classList.remove('bg-transparent-important');
            if (root) root.classList.remove('bg-transparent-important');
        };
    }, []);

    // Progress
    const progress = goal > 0 ? Math.min((likes / goal) * 100, 100) : 0;

    // Show a minimal "Loading" indicator for OBS (often invisible but helpful)
    if (loading && likes === 0) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-transparent">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex items-center justify-center bg-transparent overflow-hidden">
            {/* 
                Design optimized for OBS:
                - Transparent background
                - Bold, readable fonts
                - Minimal strokes
             */}
            <div className="w-[600px] p-6 relative flex flex-col items-center justify-center animate-fadeIn">
                {/* Text: LIKE 0/100 */}
                <h1 className="text-8xl font-black leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-tighter mb-4 uppercase transition-all duration-500"
                    style={{ textShadow: '4px 4px 0px #000', color: textColor }}>
                    LIKE {likes}/{goal}
                </h1>

                {/* Bar */}
                <div className="w-full h-12 rounded-full overflow-hidden backdrop-blur-sm shadow-2xl"
                    style={{ backgroundColor: bgColor, border: `4px solid ${borderColor}` }}>
                    <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%`, backgroundColor: barColor, boxShadow: `0 0 30px ${barColor}99` }}
                    />
                </div>

                {/* Error Debug (only visible if there's an issue) */}
                {errorMsg && (
                    <div className="absolute -bottom-8 left-0 right-0 text-center">
                        <span className="bg-red-500/80 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse">
                            {errorMsg} {debugInfo && ` [${debugInfo}]`}
                        </span>
                    </div>
                )}

                {!loading && !errorMsg && !streamFound && (
                    <div className="absolute -bottom-8 left-0 right-0 text-center">
                        <span className="bg-amber-500/80 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                            Live Offline ou Não Detectada
                        </span>
                    </div>
                )}

                {!loading && !errorMsg && streamFound && likes === 0 && goal === 100 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/10 uppercase font-bold tracking-widest whitespace-nowrap">
                        Aguardando dados da live...
                    </div>
                )}
            </div>
        </div>
    );
};
