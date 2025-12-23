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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido.");
    }
    const providerToken = authHeader.replace('Bearer ', '');

    // Query all user's broadcasts and filter for active ones in code
    // Using broadcastType=all to get all types, then we'll filter by lifeCycleStatus
    const apiUrl = 'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true&maxResults=10';

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
      // Filter for broadcasts that are currently live
      const activeBroadcast = data.items.find((item: any) =>
        item.status?.lifeCycleStatus === 'live' ||
        item.status?.lifeCycleStatus === 'liveStarting'
      );

      if (activeBroadcast && activeBroadcast.snippet?.liveChatId) {
        const liveChatId = activeBroadcast.snippet.liveChatId;
        const channelTitle = activeBroadcast.snippet.channelTitle || "YouTube";
        return new Response(JSON.stringify({ liveChatId, channelTitle }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        return new Response(JSON.stringify({ error: "Nenhuma transmissão ao vivo ativa encontrada. Verifique se sua live está realmente ao vivo." }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Nenhuma transmissão encontrada na sua conta." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

  } catch (error) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});