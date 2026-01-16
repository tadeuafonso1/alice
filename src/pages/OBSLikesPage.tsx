import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Supabase Anon Key for public access to the Edge Function from OBS
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dGxpcm1mYXZoYWh3dHNkY2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDgwNDQsImV4cCI6MjA3OTQ4NDA0NH0.KCq4Mre83Iwqppt70XXXOkVTvnwDJE9Ss341jyRAOCI";

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
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const fetchStats = async () => {
        const pathParts = window.location.pathname.split('/');
        const idFromPath = pathParts[pathParts.length - 1];
        const cleanUserId = (idFromPath || userId)?.trim();

        if (!cleanUserId || cleanUserId === 'undefined' || cleanUserId.length < 20) {
            setErrorMsg("ID de usuário inválido ou ausente no link");
            return;
        }

        try {
            // Include ID in path AND query for maximum server-side detection compatibility
            const functionUrl = `https://nvtlirmfavhahwtsdchk.supabase.co/functions/v1/youtube-stats-fetch/${cleanUserId}?target_user_id=${cleanUserId}`;

            const response = await fetch(functionUrl, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'x-target-user-id': cleanUserId
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                setErrorMsg(`Erro ${response.status}: Servidor indisponível`);
                return;
            }

            const data = await response.json();

            if (data) {
                if (data.error) {
                    setErrorMsg(data.error);
                    setDebugInfo(`UID: ${data.debug?.userId?.substring(0, 8) || '?'}`);
                } else {
                    setErrorMsg(null);
                    setLikes(data.likes || 0);
                    setGoal(data.goal || 100);
                    setDebugInfo('');

                    if (data.colors) {
                        setBarColor(data.colors.bar || '#2563eb');
                        setBgColor(data.colors.bg || '#ffffff1a');
                        setBorderColor(data.colors.border || '#ffffffcc');
                        setTextColor(data.colors.text || '#ffffff');
                    }
                }
            }
        } catch (err: any) {
            setErrorMsg(`Erro de conexão: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
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

                {!loading && !errorMsg && likes === 0 && goal === 100 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/10 uppercase font-bold tracking-widest whitespace-nowrap">
                        Aguardando dados da live...
                    </div>
                )}
            </div>
        </div>
    );
};
