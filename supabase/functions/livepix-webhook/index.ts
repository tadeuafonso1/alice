// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req: Request) => {
    const origin = req.headers.get('Origin') || '*';
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-target-user-id, accept, origin, referer, user-agent, x-livepix-signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        const url = new URL(req.url);
        let userId = url.searchParams.get('user_id');

        // Fallbacks for better robustness
        const body = await req.json().catch(() => ({}));
        if (!userId) userId = req.headers.get('x-user-id') || body.user_id;

        if (!userId) {
            throw new Error("User ID is required (searchParams, headers or body).");
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch LivePix settings for this user
        const { data: settings, error: settingsError } = await supabase
            .from('live_pix_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (settingsError || !settings) {
            throw new Error("LivePix settings not found for this user.");
        }

        if (!settings.enabled) {
            return new Response(JSON.stringify({ message: "LivePix integration disabled." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        console.log("[LivePix] Webhook received:", JSON.stringify(body));

        // Basic validation: LivePix sends a 'type' field
        // For production, you should validate settings.webhook_secret if LivePix supports it

        const donorName = body.data?.author?.name || "Doador Anônimo";
        const amount = body.data?.amount || 0;
        const message = body.data?.message || "";

        console.log(`[LivePix] Processing: ${donorName} - R$ ${amount} (${userId})`);

        // 1. Grant Loyalty Points
        if (settings.points_per_real > 0 && amount > 0) {
            const pointsToAdd = Math.floor(amount * settings.points_per_real);
            let targetUser = donorName;
            const mentionMatch = message.match(/@(\w+)/);
            if (mentionMatch) {
                targetUser = mentionMatch[1];
            }

            console.log(`[LivePix] Adding ${pointsToAdd} points to ${targetUser}`);

            const { error: pointsError } = await supabase.rpc('add_loyalty_points', {
                p_user_id: userId,
                p_username: targetUser,
                p_points: pointsToAdd
            });

            if (pointsError) console.error("[LivePix] Error adding points:", pointsError);
        }

        // 2. Fura-Fila (Skip Queue)
        if (settings.skip_queue_enabled && amount >= settings.skip_queue_price) {
            console.log(`[LivePix] Skipping queue check for ${donorName}`);

            const { data: queueUser } = await supabase
                .from('queue')
                .select('*')
                .eq('user_id', userId)
                .ilike('username', `%${donorName}%`)
                .maybeSingle();

            if (queueUser) {
                const currentPriority = Number(queueUser.priority_amount || 0);
                const newPriority = currentPriority + amount;

                await supabase
                    .from('queue')
                    .update({ priority_amount: newPriority, is_priority: true })
                    .eq('id', queueUser.id);

                console.log(`[LivePix] User ${donorName} priority increased to ${newPriority}.`);
            } else {
                console.log(`[LivePix] User ${donorName} not found in queue.`);
            }
        }

        const alertMsg = settings.skip_queue_message.replace('{user}', donorName);
        await supabase.from('bot_notifications').insert({
            user_id: userId,
            message: alertMsg,
            type: 'livepix_alert',
            created_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true, message: "Webhook processed" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("[LivePix] CRITICAL ERROR:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
