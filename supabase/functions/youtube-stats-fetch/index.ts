// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
    const origin = req.headers.get('Origin') || '*';
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-target-user-id, accept, origin, referer, user-agent',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    const url = new URL(req.url);
    const idFromPath = url.pathname.split('/').pop();
    const idFromQuery = url.searchParams.get('target_user_id') || url.searchParams.get('uid');
    const idFromHeader = req.headers.get('x-target-user-id');
    const potentialId = (idFromQuery || idFromHeader || idFromPath || '').trim();

    let userId: string | null = null;

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        );

        if (potentialId && potentialId.length > 20 && potentialId !== 'youtube-stats-fetch') {
            userId = potentialId;
        } else {
            const authHeader = req.headers.get('Authorization');
            if (authHeader && !authHeader.includes('undefined')) {
                const token = authHeader.replace('Bearer ', '');
                if (!(token.length > 200 && token.includes('eyJhbGci'))) {
                    const { data: { user } } = await supabaseClient.auth.getUser(token);
                    if (user) userId = user.id;
                }
            }
        }

        if (!userId) {
            return new Response(JSON.stringify({
                error: "Dificuldade em identificar o usuário.",
                debug: { path: idFromPath, query: idFromQuery, header: idFromHeader }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (req.method === 'POST') {
            const reqJson = await req.json().catch(() => ({}));
            const { goal, step, auto_update, bar_color, bg_color, border_color, text_color } = reqJson;

            if (goal !== undefined || bar_color !== undefined) {
                const { error: upsertError } = await supabaseClient.from('like_goals').upsert({
                    user_id: userId,
                    current_goal: goal,
                    step: step,
                    auto_update: auto_update,
                    bar_color: bar_color,
                    bg_color: bg_color,
                    border_color: border_color,
                    text_color: text_color
                });

                if (upsertError) throw upsertError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
        }

        const { data: tokenData, error: tokenError } = await supabaseClient
            .from('youtube_tokens')
            .select('access_token')
            .eq('user_id', userId)
            .single();

        if (tokenError || !tokenData) {
            return new Response(JSON.stringify({
                error: "Token do YouTube não encontrado.",
                code: "NO_TOKEN",
                likes: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const { data: goalData, error: goalError } = await supabaseClient
            .from('like_goals')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        let currentGoal = goalData?.current_goal ?? 100;
        let stepCount = goalData?.step ?? 50;
        let autoUpdate = goalData?.auto_update ?? true;
        let barColor = goalData?.bar_color ?? '#2563eb';
        let bgColor = goalData?.bg_color ?? '#ffffff1a';
        let borderColor = goalData?.border_color ?? '#ffffffcc';
        let textColor = goalData?.text_color ?? '#ffffff';

        const fetchYouTube = async (url: string) => {
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/json',
                },
            });
            const json = await res.json();
            if (!res.ok) {
                if (res.status === 401) throw new Error("YOUTUBE_TOKEN_EXPIRED");
                throw new Error(`YouTube API Error: ${json.error?.message || res.statusText}`);
            }
            return json;
        }

        let likeCount = 0;
        let streamFound = false;

        try {
            const broadcastUrl = `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet&broadcastStatus=active&broadcastType=all&mine=true`;
            const broadcastData = await fetchYouTube(broadcastUrl);

            if (broadcastData.items && broadcastData.items.length > 0) {
                streamFound = true;
                const videoId = broadcastData.items[0].id;
                const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`;
                const videoData = await fetchYouTube(videoUrl);

                if (videoData.items && videoData.items.length > 0) {
                    likeCount = parseInt(videoData.items[0].statistics.likeCount || "0", 10);
                }
            }
        } catch (fetchError: any) {
            if (fetchError.message === "YOUTUBE_TOKEN_EXPIRED") throw fetchError;
            console.error("Fetch warning:", fetchError);
        }

        let goalUpdated = false;
        if (autoUpdate && likeCount >= currentGoal) {
            const diff = likeCount - currentGoal;
            const stepsToAdd = Math.floor(diff / stepCount) + 1;
            currentGoal = currentGoal + (stepCount * stepsToAdd);
            goalUpdated = true;

            await supabaseClient.from('like_goals').upsert({
                user_id: userId,
                current_goal: currentGoal,
                step: stepCount,
                auto_update: autoUpdate,
                bar_color: barColor,
                bg_color: bgColor,
                border_color: borderColor,
                text_color: textColor
            });
        }

        try {
            await supabaseClient
                .from('like_goals')
                .update({
                    current_likes: likeCount,
                    current_goal: currentGoal,
                    stream_found: streamFound,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);
        } catch (dbErr) {
            console.error('[Stats-Fetch] DB Failure:', dbErr);
        }

        return new Response(JSON.stringify({
            likes: likeCount,
            goal: currentGoal,
            streamFound,
            goalUpdated,
            colors: { bar: barColor, bg: bgColor, border: borderColor, text: textColor }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Erro na Edge Function:", error.message);
        return new Response(JSON.stringify({
            error: error.message,
            code: error.message === "YOUTUBE_TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INTERNAL_ERROR",
            userId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
