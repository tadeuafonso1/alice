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
            <div className="w-[600px] bg-slate-900/90 border-2 border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-end justify-between mb-2">
                    <div className="flex flex-col">
                        <span className="text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">Meta de Likes</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white leading-none filter drop-shadow-md">{likes.toLocaleString()}</span>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-slate-500 mb-1">/ {goal.toLocaleString()}</span>
                </div>

                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
