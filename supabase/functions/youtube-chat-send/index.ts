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

        // Lógica Principal: Tenta enviar -> Se 401/403, tenta renovar -> Re-tenta enviar
        let response;
        let renewalLog = [];

        // 1. Tentar com o token recebido (se houver)
        if (providerToken) {
            response = await sendMessage(providerToken);
        }

        // 2. Se não tinha token, ou se falhou com auth error, tenta buscar do banco e renovar
        if (!providerToken || (response && (response.status === 401 || response.status === 403))) {
            renewalLog.push(providerToken ? `Falha inicial (${response.status})` : "Token ausente no request");

            // Só conseguimos renovar se tivermos um usuário autenticado no Supabase
            if (!isAuthValid) {
                renewalLog.push("Impossível renovar: Sessão Supabase inválida/ausente");
                // Se não tínhamos response ainda (caso providerToken null), criamos uma response fake de erro
                if (!response) {
                    response = new Response(JSON.stringify({ error: "Token ausente e sessão inválida" }), { status: 401 });
                }
            } else {
                const { data: userData, error: userError } = await supabaseClient.auth.getUser(authHeader!.replace('Bearer ', ''));
                const user = userData?.user;

                if (userError || !user) {
                    renewalLog.push(`Erro User Supabase: ${userError?.message || 'User null'}`);
                } else {
                    const { data: tokenData, error: dbError } = await supabaseClient
                        .from('youtube_tokens')
                        .select('refresh_token')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (dbError || !tokenData?.refresh_token) {
                        renewalLog.push(dbError ? `Erro DB: ${dbError.message}` : "Refresh Token não achado no DB");
                    } else {
                        try {
                            renewalLog.push("Renovando token via Google...");
                            const newTokenData = await getNewToken(tokenData.refresh_token);
                            const newAccessToken = newTokenData.access_token;

                            if (newAccessToken) {
                                renewalLog.push("Token renovado com sucesso");
                                // Salva novo token e expiração
                                await supabaseClient.from('youtube_tokens').update({
                                    access_token: newAccessToken,
                                    expires_at: new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString()
                                }).eq('user_id', user.id);

                                // Tenta enviar novamente com o novo token
                                response = await sendMessage(newAccessToken);
                                if (response.ok) {
                                    renewalLog.push("Envio com novo token: SUCESSO");
                                } else {
                                    renewalLog.push(`Envio com novo token: FALHA (${response.status})`);
                                }
                            } else {
                                renewalLog.push("Google não retornou access_token");
                            }
                        } catch (e: any) {
                            renewalLog.push(`Exceção na renovação: ${e.message}`);
                        }
                    }
                }
            }
        }

        // Caso onde providerToken era null e não conseguimos renovar (response ainda undefined)
        if (!response) {
            console.error("Falha: Sem token e sem refresh success");
            return new Response(JSON.stringify({
                success: false,
                error: `Erro de Autenticação: Token ausente e falha na renovação. Detalhes: ${renewalLog.join(' -> ')}`
            }), {
                status: 200, // Retornamos 200 pro front tratar o erro JSON
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let googleError = errorData.error?.message || response.statusText;
            console.error("Erro da API do YouTube (envio):", errorData);

            let hint = "";
            if (response.status === 401) {
                hint = " (Sua conexão expirou. Por favor, faça LOGOUT (Sair) do bot e faça LOGIN novamente para renovar a permissão.)";
            }

            // Append detailed renewal log if available to help debugging
            if (renewalLog.length > 0) {
                googleError += ` | Debug: ${renewalLog.join(' -> ')}`;
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


