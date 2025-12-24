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

        // Pegar o usuário da sessão para segurança
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

        if (userError || !user) throw new Error("Usuário não autenticado");

        const { access_token, refresh_token, expires_in, channelId } = await req.json();

        if (!access_token) throw new Error("access_token é obrigatório");

        const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null;

        // Upsert na tabela de tokens
        const { error: upsertError } = await supabaseClient
            .from('youtube_tokens')
            .upsert({
                user_id: user.id,
                access_token,
                refresh_token,
                expires_at: expiresAt,
                channel_id: channelId,
            }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Erro na Edge Function youtube-token-sync:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
