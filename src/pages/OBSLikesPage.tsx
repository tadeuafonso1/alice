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
            <div className="w-[600px] p-6 relative overflow-hidden">
                <div className="flex items-end justify-between mb-2">
                    <div className="flex flex-col">
                        <span className="text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] mb-1 drop-shadow-md shadow-black">Meta de Likes</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0px 0px 10px rgba(0,0,0,0.5)' }}>
                                {likes.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">/ {goal.toLocaleString()}</span>
                </div>

                <div className="w-full h-4 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
