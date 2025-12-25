// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

        const body = await req.json().catch(() => ({}));
        const { liveChatId, messageText, youtubeToken } = body;
        let providerToken = youtubeToken || null;

        const authHeader = req.headers.get('Authorization');
        const isAuthValid = authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7;

        if (!liveChatId || !messageText) {
            return new Response(JSON.stringify({ success: false, error: "liveChatId e messageText são obrigatórios." }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const sendMessage = async (token: string) => {
            const apiUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet`;
            const payload = {
                snippet: {
                    liveChatId: liveChatId,
                    type: 'textMessageEvent',
                    textMessageDetails: { messageText: messageText }
                }
            };

            return await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
        };

        let response = await sendMessage(providerToken || '');

        // Renovação automática
        if (!response.ok && response.status === 401) {
            console.log("YouTube (envio) retornou 401. Tentando renovar...");

            if (!isAuthValid) {
                console.warn("Renovação abortada (envio): Authorization header (Supabase) inválido ou ausente.");
            } else {
                const { data: userData, error: userError } = await supabaseClient.auth.getUser(authHeader!.replace('Bearer ', ''));
                const user = userData?.user;

                if (userError || !user) {
                    console.error("Erro ao obter usuário Supabase (envio):", userError?.message);
                } else {
                    console.log(`Usuário identificado (envio): ${user.id}. Buscando refresh_token no banco...`);
                    const { data: tokenData, error: dbError } = await supabaseClient
                        .from('youtube_tokens')
                        .select('refresh_token')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (dbError) {
                        console.error("Erro ao buscar token no banco (envio):", dbError.message);
                    } else if (!tokenData?.refresh_token) {
                        console.warn("Nenhum refresh_token encontrado para este usuário no banco (envio).");
                    } else {
                        try {
                            console.log("Refresh token encontrado (envio). Solicitando novo access_token...");
                            const newTokenData = await getNewToken(tokenData.refresh_token);
                            const newAccessToken = newTokenData.access_token;
                            console.log("Mensagem: Novo token obtido com sucesso!");

                            await supabaseClient
                                .from('youtube_tokens')
                                .update({
                                    access_token: newAccessToken,
                                    expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
                                })
                                .eq('user_id', user.id);

                            console.log("Banco atualizado (envio). Re-tentando envio da mensagem...");
                            response = await sendMessage(newAccessToken);
                        } catch (renewalError: any) {
                            console.error("Erro crítico na renovação (envio):", renewalError.message);
                        }
                    }
                }
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const googleError = errorData.error?.message || response.statusText;
            console.error("Erro da API do YouTube (envio):", errorData);

            let hint = "";
            if (response.status === 401) {
                hint = " (Sua conexão expirou. Clique em 'Reconectar' nas configurações)";
            }

            return new Response(JSON.stringify({
                success: false,
                error: `Erro YouTube (${response.status}): ${googleError}${hint}`
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Erro global youtube-chat-send:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});


