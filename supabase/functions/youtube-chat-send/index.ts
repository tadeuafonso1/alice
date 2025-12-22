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
        const providerToken = req.headers.get('x-youtube-token');
        if (!providerToken) {
            return new Response(JSON.stringify({ success: false, error: "Token do YouTube (x-youtube-token) não fornecido." }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { liveChatId, messageText } = await req.json();

        if (!liveChatId || !messageText) {
            return new Response(JSON.stringify({ success: false, error: "liveChatId e messageText são obrigatórios." }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const apiUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet`;

        const body = {
            snippet: {
                liveChatId: liveChatId,
                type: 'textMessageEvent',
                textMessageDetails: {
                    messageText: messageText
                }
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erro da API do YouTube:", errorData);
            return new Response(JSON.stringify({
                success: false,
                error: `Erro YouTube (${response.status}): ${JSON.stringify(errorData.error?.message || errorData)}`
            }), {
                status: 200, // Retornamos 200 para o Supabase não mascarar o erro
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Erro na Edge Function:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Mesmo erro interno retornamos 200 para debug
        });
    }
});
