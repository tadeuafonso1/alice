// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

async function getNewToken(refreshToken: string) {
    // @ts-ignore
    const client_id = Deno.env.get('GOOGLE_CLIENT_ID');
    // @ts-ignore
    const client_secret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!client_id || !client_secret) {
        throw new Error("GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados.");
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id,
            client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Falha ao renovar token: ${JSON.stringify(error)}`);
    }

    return await response.json();
}

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
    let likeCount = 0;
    let subscriberCount = 0;
    let currentGoal = 100;
    let stepCount = 50;
    let autoUpdate = true;
    let streamFound = false;
    let barColor = '#2563eb';
    let bgColor = '#ffffff1a';
    let borderColor = '#ffffffcc';
    let textColor = '#ffffff';
    let debugInfo: any = {};
    let goalUpdated = false;

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        if (potentialId && potentialId.length > 20 && potentialId !== 'youtube-stats-fetch') {
            userId = potentialId;
        } else {
            const authHeader = req.headers.get('Authorization');
            if (authHeader && !authHeader.includes('undefined')) {
                const token = authHeader.replace('Bearer ', '');
                if (token.length > 200 && token.includes('eyJhbGci')) {
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

        // --- MANAGE GOALS (POST) ---
        if (req.method === 'POST') {
            const reqJson = await req.json().catch(() => ({}));

            // Subscriber Goal Settings handling removed per user request.

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
                    text_color: text_color,
                    updated_at: new Date().toISOString()
                });
                if (upsertError) throw upsertError;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }

        // --- FETCH STATS (GET) ---
        const { data: tokenData, error: tokenError } = await supabaseClient
            .from('youtube_tokens')
            .select('access_token, refresh_token, channel_id')
            .eq('user_id', userId)
            .single();

        if (tokenError || !tokenData) {
            return new Response(JSON.stringify({ error: "Token do YouTube não encontrado.", code: "NO_TOKEN", likes: 0, debug: { hasUserId: !!userId } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // Load Like Goal Settings
        const { data: goalData } = await supabaseClient.from('like_goals').select('*').eq('user_id', userId).maybeSingle();
        if (goalData) {
            currentGoal = goalData.current_goal;
            stepCount = goalData.step;
            autoUpdate = goalData.auto_update;
            barColor = goalData.bar_color || barColor;
            bgColor = goalData.bg_color || bgColor;
            borderColor = goalData.border_color || borderColor;
            textColor = goalData.text_color || textColor;
        }

        const fetchYouTube = async (youtubeUrl: string) => {
            let res = await fetch(youtubeUrl, {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Accept': 'application/json' },
            });

            if (res.status === 401) {
                console.log("[Stats-Fetch] Token expired, refreshing...");
                if (tokenData.refresh_token) {
                    const refreshedToken = await getNewToken(tokenData.refresh_token);
                    tokenData.access_token = refreshedToken.access_token;
                    await supabaseClient.from('youtube_tokens').update({
                        access_token: refreshedToken.access_token,
                        expires_at: new Date(Date.now() + refreshedToken.expires_in * 1000).toISOString()
                    }).eq('user_id', userId);

                    res = await fetch(youtubeUrl, {
                        headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Accept': 'application/json' },
                    });
                }
            }

            const json = await res.json();
            if (!res.ok) throw new Error(`YouTube API Error: ${json.error?.message || res.statusText}`);
            return json;
        };

        // 1. Fetch Likes from active broadcast
        try {
            const broadcastUrl = `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,status&mine=true&maxResults=5`;
            const broadcastData = await fetchYouTube(broadcastUrl);
            let activeBroadcast = broadcastData.items?.find((item: any) =>
                item.status?.lifeCycleStatus === 'live' || item.status?.lifeCycleStatus === 'liveStarting'
            );

            if (!activeBroadcast && tokenData.channel_id) {
                const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&eventType=live&maxResults=1`;
                const searchData = await fetchYouTube(searchUrl);
                if (searchData.items?.length > 0) {
                    activeBroadcast = { id: searchData.items[0].id.videoId };
                }
            }

            if (activeBroadcast) {
                streamFound = true;
                const videoId = activeBroadcast.id;
                const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`;
                const videoData = await fetchYouTube(videoUrl);
                if (videoData.items?.length > 0) {
                    likeCount = parseInt(videoData.items[0].statistics.likeCount || "0", 10);
                }
            }
        } catch (err: any) {
            console.error("[Stats-Fetch] Like fetch failed:", err.message);
        }

        // 2. Fetch Subscriber Count - REMOVED PER USER REQUEST
        // (Logic removed to save quota and disable feature)

        // 3. Process Like Goal Progress
        if (autoUpdate && likeCount >= currentGoal) {
            const diff = likeCount - currentGoal;
            const stepsToAdd = Math.floor(diff / stepCount) + 1;
            currentGoal = currentGoal + (stepCount * stepsToAdd);
            goalUpdated = true;
        }

        // 4. Process Subscriber Goal Progress - REMOVED PER USER REQUEST

        // 5. Update Like Goal in DB
        await supabaseClient.from('like_goals').update({
            current_likes: likeCount,
            current_goal: currentGoal,
            stream_found: streamFound,
            updated_at: new Date().toISOString(),
            debug_log: JSON.stringify({ likes: likeCount, subs: subscriberCount, streamFound })
        }).eq('user_id', userId);

        return new Response(JSON.stringify({
            likes: likeCount,
            // subscribers: subscriberCount, // Removed
            goal: currentGoal,
            step: stepCount,
            auto_update: autoUpdate,
            streamFound,
            goalUpdated,
            colors: { bar: barColor, bg: bgColor, border: borderColor, text: textColor },
            version: '2.4-NO-SUBS'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Erro na Edge Function:", error.message);
        return new Response(JSON.stringify({
            error: error.message,
            code: "INTERNAL_ERROR",
            debug: { error: error.message }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
