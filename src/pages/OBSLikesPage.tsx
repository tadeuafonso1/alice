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

    const fetchStats = async () => {
        if (!userId) return;
        try {
            // Fetch stats using GET with target_user_id in query params AND headers for OBS compatibility
            const { data, error } = await supabase.functions.invoke(`youtube-stats-fetch?target_user_id=${userId}`, {
                method: 'GET',
                headers: {
                    'x-target-user-id': userId
                }
            });

            if (data && !error) {
                setLikes(data.likes || 0);
                setGoal(data.goal || 100);

                if (data.colors) {
                    setBarColor(data.colors.bar || '#2563eb');
                    setBgColor(data.colors.bg || '#ffffff1a');
                    setBorderColor(data.colors.border || '#ffffffcc');
                    setTextColor(data.colors.text || '#ffffff');
                }
            } else if (error) {
                console.error('Supabase Function Error:', error);
            }
        } catch (err) {
            console.error('Fetch Error:', err);
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
                {!loading && likes === 0 && goal === 100 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/10 uppercase font-bold tracking-widest whitespace-nowrap">
                        Aguardando dados da live...
                    </div>
                )}
            </div>
        </div>
    );
};
