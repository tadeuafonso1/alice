// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const authHeader = req.headers.get('Authorization');

    let { channelId } = await req.json().catch(() => ({}));

    // Se NÃO temos o header de autorização, mas temos o channelId, usamos a API KEY
    if (!authHeader && channelId) {
      if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY não configurada.");

      console.log(`Buscando live por Channel ID: ${channelId}`);
      // 1. Procurar por vídeo ao vivo no canal
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${YOUTUBE_API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.items && searchData.items.length > 0) {
        const videoId = searchData.items[0].id.videoId;
        const channelTitle = searchData.items[0].snippet.channelTitle;

        // 2. Buscar o liveChatId desse vídeo
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const videoRes = await fetch(videoUrl);
        const videoData = await videoRes.json();

        if (videoData.items && videoData.items[0]?.liveStreamingDetails?.liveChatId) {
          return new Response(JSON.stringify({
            liveChatId: videoData.items[0].liveStreamingDetails.liveChatId,
            channelTitle: channelTitle,
            channelId: channelId
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }

      return new Response(JSON.stringify({ error: "Nenhuma live ativa encontrada para este canal." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Caso contrário, busca usando o Token do Google (User-Owned)
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido.");
    }
    const providerToken = authHeader.replace('Bearer ', '');

    // Busca transmissões ativas
    const apiUrl = 'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true&maxResults=5';

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API do YouTube:", errorData);
      throw new Error(`Erro ao buscar transmissões: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const activeBroadcast = data.items.find((item: any) =>
        item.status?.lifeCycleStatus === 'live' ||
        item.status?.lifeCycleStatus === 'liveStarting'
      );

      if (activeBroadcast && activeBroadcast.snippet?.liveChatId) {
        const liveChatId = activeBroadcast.snippet.liveChatId;
        const channelTitle = activeBroadcast.snippet.channelTitle || "YouTube";
        const foundChannelId = activeBroadcast.snippet.channelId;

        return new Response(JSON.stringify({
          liveChatId,
          channelTitle,
          channelId: foundChannelId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ error: "Nenhuma live ativa encontrada. Se você abriu sua live agora, aguarde 1-2 minutos." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});