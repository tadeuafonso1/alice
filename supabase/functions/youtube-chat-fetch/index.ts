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
    if (!YOUTUBE_API_KEY) {
      throw new Error("A chave da API do YouTube não foi configurada nos segredos.");
    }

    const { liveChatId, pageToken } = await req.json();
    if (!liveChatId) {
      return new Response(JSON.stringify({ error: "liveChatId é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let apiUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${YOUTUBE_API_KEY}`;
    if (pageToken) {
      apiUrl += `&pageToken=${pageToken}`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API do YouTube:", errorData);
      throw new Error(`Erro ao buscar mensagens: ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});