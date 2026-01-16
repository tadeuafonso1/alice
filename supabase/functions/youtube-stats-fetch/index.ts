// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-target-user-id',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Prepare Supabase Client (Service Role for OBS access, User Auth for Dashboard)
        const supabaseClient = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: { persistSession: false },
            }
        );

        // Support for GET requests (for stats fetching) and POST (for saving settings)
        let userId: string | null = null;
        const url = new URL(req.url);

        console.log(`[youtube-stats-fetch] Request URL: ${req.url}`);
        console.log(`[youtube-stats-fetch] Method: ${req.method}`);

        const paramId = url.searchParams.get('target_user_id');
        const headerId = req.headers.get('x-target-user-id');

        console.log(`[youtube-stats-fetch] Param ID: ${paramId}, Header ID: ${headerId}`);

        if (paramId) {
            userId = paramId;
        } else if (headerId) {
            userId = headerId;
        } else {
            // Dashboard Mode: Authenticate User
            const authHeader = req.headers.get('Authorization');
            if (!authHeader || authHeader.includes('undefined')) {
                throw new Error("ID de usuário não encontrado (nenhum target_user_id ou token de sessão).");
            }

            const token = authHeader.replace('Bearer ', '');
            // If the token is just the anon key, this is a public request missing a target_user_id
            if (token.length > 200 && token.includes('eyJhbGci')) {
                // Potential Anon Key but no target_user_id provided
                throw new Error("ID de usuário ausente no pedido público (overlay).");
            }

            const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
            if (userError || !user) throw new Error("Usuário não autenticado ou sessão expirada.");
            userId = user.id;
        }

        if (!userId) throw new Error("Falha crítica ao identificar o proprietário da meta.");

        if (req.method === 'POST') {
            const reqJson = await req.json().catch(() => ({}));
            const { goal, step, auto_update, bar_color, bg_color, border_color, text_color } = reqJson;

            // Only save if actual setting data is provided in the body
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

        // 1. Get YouTube Token from DB
        const { data: tokenData, error: tokenError } = await supabaseClient
            .from('youtube_tokens')
            .select('access_token')
            .eq('user_id', userId)
            .single();

        if (tokenError || !tokenData) {
            // Friendly error for OBS
            return new Response(JSON.stringify({
                error: "Token do YouTube não encontrado. O usuário precisa fazer login no painel.",
                code: "NO_TOKEN",
                likes: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Return 200 so OBS doesn't show a generic network error
            });
        }

        // 2. Get Goal Settings from DB
        const { data: goalData, error: goalError } = await supabaseClient
            .from('like_goals')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        // Defaults
        let currentGoal = goalData?.current_goal ?? 100;
        let step = goalData?.step ?? 50;
        let autoUpdate = goalData?.auto_update ?? true;

        // Color defaults
        let barColor = goalData?.bar_color ?? '#2563eb';
        let bgColor = goalData?.bg_color ?? '#ffffff1a';
        let borderColor = goalData?.border_color ?? '#ffffffcc';
        let textColor = goalData?.text_color ?? '#ffffff';

        // 3. Fetch YouTube Data
        const accessToken = tokenData.access_token;

        const fetchYouTube = async (url: string) => {
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
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
            // Handle specific fetch errors if needed, but for now propagate
            if (fetchError.message === "YOUTUBE_TOKEN_EXPIRED") throw fetchError;
            console.error("Fetch warning:", fetchError);
        }

        // 4. Update Goal Logic (Server-side)
        let goalUpdated = false;
        if (autoUpdate && likeCount >= currentGoal) {
            const diff = likeCount - currentGoal;
            const stepsToAdd = Math.floor(diff / step) + 1;
            currentGoal = currentGoal + (step * stepsToAdd);
            goalUpdated = true;

            // Persist new goal
            await supabaseClient.from('like_goals').upsert({
                user_id: userId,
                current_goal: currentGoal,
                step: step,
                auto_update: autoUpdate,
                bar_color: barColor,
                bg_color: bgColor,
                border_color: borderColor,
                text_color: textColor
            });
        }

        return new Response(JSON.stringify({
            likes: likeCount,
            goal: currentGoal,
            step: step,
            streamFound: streamFound,
            goalUpdated: goalUpdated,
            debug: {
                userId,
                method: req.method,
                hasToken: !!tokenData
            },
            colors: {
                bar: barColor,
                bg: bgColor,
                border: borderColor,
                text: textColor
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Erro na Edge Function youtube-stats-fetch:", error.message);
        const isExpired = error.message === "YOUTUBE_TOKEN_EXPIRED";

        return new Response(JSON.stringify({
            error: error.message,
            code: isExpired ? "TOKEN_EXPIRED" : "INTERNAL_ERROR",
            debug_userId: "ERROR_CATCH"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 to allow the frontend to see the error message
        });
    }
});
