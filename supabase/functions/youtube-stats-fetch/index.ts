// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    persistSession: false,
                },
            }
        );

        // 1. Authenticate Supabase User
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

        if (userError || !user) throw new Error("Usuário não autenticado");

        // 2. Get YouTube Token from DB
        const { data: tokenData, error: tokenError } = await supabaseClient
            .from('youtube_tokens')
            .select('access_token')
            .eq('user_id', user.id)
            .single();

        if (tokenError || !tokenData) throw new Error("Token do YouTube não encontrado. Faça login novamente.");

        const accessToken = tokenData.access_token;

        // 3. Helper to make YouTube requests
        const fetchYouTube = async (url: string) => {
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            });
            const json = await res.json();
            if (!res.ok) {
                // If 401, likely token expired
                if (res.status === 401) {
                    throw new Error("YOUTUBE_TOKEN_EXPIRED");
                }
                throw new Error(`YouTube API Error: ${json.error?.message || res.statusText}`);
            }
            return json;
        }

        // 4. Find Active Live Broadcast
        // mine=true ensures we look at the user's channel
        const broadcastUrl = `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet&broadcastStatus=active&broadcastType=all&mine=true`;
        const broadcastData = await fetchYouTube(broadcastUrl);

        if (!broadcastData.items || broadcastData.items.length === 0) {
            // Fallback: If no active live stream, maybe return 0 or check for most recent video?
            // For now, let's just return 0 to indicate no live stream found.
            return new Response(JSON.stringify({
                likes: 0,
                streamFound: false,
                message: "Nenhuma live ativa encontrada."
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const videoId = broadcastData.items[0].id;
        const videoTitle = broadcastData.items[0].snippet.title;

        // 5. Fetch Video Stats (Likes)
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`;
        const videoData = await fetchYouTube(videoUrl);

        if (!videoData.items || videoData.items.length === 0) {
            throw new Error("Vídeo encontrado mas detalhes não disponíveis.");
        }

        const stats = videoData.items[0].statistics;
        const likeCount = parseInt(stats.likeCount || "0", 10);
        // Note: viewCount is also available in stats

        return new Response(JSON.stringify({
            likes: likeCount,
            videoId: videoId,
            videoTitle: videoTitle,
            streamFound: true,
            success: true
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Erro na Edge Function youtube-stats-fetch:", error.message);

        const isExpired = error.message === "YOUTUBE_TOKEN_EXPIRED";
        const status = isExpired ? 401 : 500;

        return new Response(JSON.stringify({
            error: error.message,
            code: isExpired ? "TOKEN_EXPIRED" : "INTERNAL_ERROR"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: status,
        });
    }
});
