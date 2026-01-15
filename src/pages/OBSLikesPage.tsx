import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const OBSLikesPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [likes, setLikes] = useState<number>(0);
    const [goal, setGoal] = useState<number>(100);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchStats = async () => {
        if (!userId) return;
        try {
            // Call generic Edge Function with target_user_id
            const { data, error } = await supabase.functions.invoke('youtube-stats-fetch', {
                body: { target_user_id: userId }
            });

            if (data && !error) {
                setLikes(data.likes || 0);
                setGoal(data.goal || 100);
            }
        } catch (err) {
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
    const progress = Math.min((likes / goal) * 100, 100);

    if (loading && likes === 0) return null;

    return (
        <div className="w-full h-screen flex items-center justify-center bg-transparent">
            {/* 
                Design optimized for OBS:
                - Transparent background (handled by container)
                - Bold, readable fonts
                - Minimal strokes
             */}
            <div className="w-[600px] p-6 relative flex flex-col items-center justify-center">
                {/* Text: 0/100 */}
                <h1 className="text-8xl font-black text-white leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-tighter mb-4"
                    style={{ textShadow: '4px 4px 0px #000' }}>
                    {likes}/{goal}
                </h1>

                {/* Bar */}
                <div className="w-full h-12 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20">
                    <div
                        className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all duration-700 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
