// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-youtube-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("A chave da API do YouTube não foi configurada nos segredos.");
    }

    let body: any = {};
    if (req.body && req.method !== 'GET') {
      try {
        body = await req.json();
      } catch (e) {
        console.warn("Body JSON inválido em chat-fetch.");
      }
    }
    const { liveChatId, pageToken } = body;

    if (!liveChatId) {
      return new Response(JSON.stringify({ error: "liveChatId é obrigatório." }), {
        status: 200, // Usando 200 para consistência
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let apiUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${YOUTUBE_API_KEY}`;
    if (pageToken) {
      apiUrl += `&pageToken=${pageToken}`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erro da API do YouTube:", errorData);
      throw new Error(`Erro ao buscar mensagens: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro na Edge Function fetch:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});