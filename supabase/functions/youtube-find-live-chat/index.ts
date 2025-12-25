// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-youtube-token',
};

async function getNewToken(refreshToken: string) {
  // @ts-ignore
  const client_id = Deno.env.get('GOOGLE_CLIENT_ID');
  // @ts-ignore
  const client_secret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!client_id || !client_secret) {
    throw new Error("GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados nas Edge Functions.");
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
    const error = await response.json();
    throw new Error(`Falha ao renovar token: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

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
      { auth: { persistSession: false } }
    );

    // @ts-ignore
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    let providerToken = req.headers.get('x-youtube-token');
    const authHeader = req.headers.get('Authorization');
    const isAuthValid = authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7;

    let { channelId } = await req.json().catch(() => ({}));

    // Se NÃO temos um token válido do sistema e temos o channelId, usamos a API KEY (anon)
    if (!isAuthValid && !providerToken && channelId) {
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

    // Caso contrário, tenta usar o Token do Google ou renovar
    if (!authHeader && !providerToken) {
      throw new Error("Token de autorização ou token do YouTube não fornecido.");
    }

    const findLiveChat = async (token: string) => {
      const apiUrl = 'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true&maxResults=5';
      return await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
    };

    let response = await findLiveChat(providerToken || '');

    // Se falhou por falta de autorização (token expirado), tenta renovar
    if (!response.ok && response.status === 401 && isAuthValid) {
      console.log("Token expirado, tentando renovar via Refresh Token...");

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

      if (user) {
        const { data: tokenData } = await supabaseClient
          .from('youtube_tokens')
          .select('refresh_token')
          .eq('user_id', user.id)
          .single();

        if (tokenData?.refresh_token) {
          try {
            const newTokenData = await getNewToken(tokenData.refresh_token);
            providerToken = newTokenData.access_token;

            console.log("Novo token obtido com sucesso!");

            await supabaseClient
              .from('youtube_tokens')
              .update({
                access_token: providerToken,
                expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
              })
              .eq('user_id', user.id);

            response = await findLiveChat(providerToken!);
          } catch (renewalError: any) {
            console.error("Erro na renovação do token:", renewalError.message);
          }
        }
      }
    }

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

  } catch (error: any) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});