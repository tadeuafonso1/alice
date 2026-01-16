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
            .select('access_token, channel_id')
            .eq('user_id', userId)
            .single();

        if (tokenError || !tokenData) {
            return new Response(JSON.stringify({
                error: "Token do YouTube não encontrado.",
                code: "NO_TOKEN",
                likes: 0,
                debug: { hasUserId: !!userId, noToken: true }
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
        let broadcastData: any = null;
        let activeBroadcast: any = null;

        try {
            // Broaden search: list mine but filter manually
            const broadcastUrl = `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,status&mine=true&maxResults=10`;

            try {
                broadcastData = await fetchYouTube(broadcastUrl);
            } catch (err: any) {
                if (err.message === "YOUTUBE_TOKEN_EXPIRED") {
                    console.log("[Stats-Fetch] Token expired, attempting refresh...");
                    const { data: fullTokenData } = await supabaseClient
                        .from('youtube_tokens')
                        .select('refresh_token')
                        .eq('user_id', userId)
                        .single();

                    if (fullTokenData?.refresh_token) {
                        const newToken = await getNewToken(fullTokenData.refresh_token);
                        tokenData.access_token = newToken.access_token;

                        await supabaseClient
                            .from('youtube_tokens')
                            .update({
                                access_token: newToken.access_token,
                                expires_at: new Date(Date.now() + newToken.expires_in * 1000).toISOString()
                            })
                            .eq('user_id', userId);

                        broadcastData = await fetchYouTube(broadcastUrl);
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }

            activeBroadcast = broadcastData.items?.find((item: any) =>
                item.status?.lifeCycleStatus === 'live' ||
                item.status?.lifeCycleStatus === 'liveStarting'
            );

            // Fallback: If no broadcast found via mine=true, try search with channelId
            if (!activeBroadcast && tokenData.channel_id) {
                console.log("[Stats-Fetch] No active broadcast found via mine=true, trying search fallback for channel:", tokenData.channel_id);
                const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&eventType=live&maxResults=1`;
                const searchData = await fetchYouTube(searchUrl);

                if (searchData.items && searchData.items.length > 0) {
                    const foundVideoId = searchData.items[0].id.videoId;
                    console.log("[Stats-Fetch] Found live video via search fallback:", foundVideoId);
                    activeBroadcast = { id: foundVideoId }; // Mock an activeBroadcast object
                }
            }

            if (activeBroadcast) {
                streamFound = true;
                const videoId = activeBroadcast.id;
                const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`;
                const videoData = await fetchYouTube(videoUrl);

                if (videoData.items && videoData.items.length > 0) {
                    likeCount = parseInt(videoData.items[0].statistics.likeCount || "0", 10);
                }
            }
        } catch (fetchError: any) {
            console.error("[Stats-Fetch] Error fetching from YouTube:", fetchError.message);
            if (fetchError.message === "YOUTUBE_TOKEN_EXPIRED") throw fetchError;
        }

        const debugInfo = {
            hasChannelId: !!tokenData.channel_id,
            channelId: tokenData.channel_id || null,
            broadcastCount: broadcastData?.items?.length || 0,
            foundViaSearch: (broadcastData && !broadcastData.items?.find((item: any) => item.status?.lifeCycleStatus === 'live' || item.status?.lifeCycleStatus === 'liveStarting')) && !!activeBroadcast,
            videoId: activeBroadcast?.id || (activeBroadcast?.snippet ? 'has_snippet' : null),
            broadcastStatus: broadcastData?.items?.[0]?.status?.lifeCycleStatus || 'none'
        };

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
                    updated_at: new Date().toISOString(),
                    debug_log: JSON.stringify(debugInfo)
                })
                .eq('user_id', userId);
        } catch (dbErr) {
            console.error('[Stats-Fetch] DB Failure:', dbErr);
        }

        return new Response(JSON.stringify({
            likes: likeCount,
            goal: currentGoal,
            step: stepCount,
            auto_update: autoUpdate,
            streamFound,
            goalUpdated,
            colors: { bar: barColor, bg: bgColor, border: borderColor, text: textColor },
            debug: debugInfo,
            version: '2.1-FIXED-SAVE'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Erro na Edge Function:", error.message);
        return new Response(JSON.stringify({
            error: error.message,
            code: error.message === "YOUTUBE_TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INTERNAL_ERROR",
            userId,
            debug: { hasUserId: !!userId, error: error.message, stack: error.stack?.substring(0, 100) }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
