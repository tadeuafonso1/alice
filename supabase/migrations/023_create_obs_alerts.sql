-- Tabela para gerenciar a fila de alertas do OBS (Inscritos, Membros, Doações)
CREATE TABLE IF NOT EXISTS public.obs_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'subscriber', 'member', 'superchat', 'donation'
    name VARCHAR(255) NOT NULL,
    amount VARCHAR(50), -- ex: 'R$ 5,00' ou 'US$ 10.00'
    message TEXT, -- Mensagem enviada pelo usuário (na doação/superchat)
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'played'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.obs_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (RLS)
-- 1. O dono (user_id) pode inserir, atualizar e deletar seus alertas (Painel de Controle)
CREATE POLICY "Users can manage their own obs alerts"
    ON public.obs_alerts
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. O acesso de leitura é público para o OBS conseguir ler sem estar logado
CREATE POLICY "Public can view obs alerts"
    ON public.obs_alerts
    FOR SELECT
    USING (true);

-- Criar índice para melhorar a performance de buscas na fila
CREATE INDEX IF NOT EXISTS idx_obs_alerts_user_status ON public.obs_alerts(user_id, status);

-- Habilitar Realtime para a tabela obs_alerts
-- Isso permite que o frontend "escute" novos alertas sendo inseridos instantaneamente
alter publication supabase_realtime add table public.obs_alerts;
