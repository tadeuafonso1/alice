-- Permitir que o OBS (usuário anônimo/não autenticado) consiga ler as configurações
-- para baixar a URL do áudio customizado.

DROP POLICY IF EXISTS "Public can view settings" ON public.settings;

CREATE POLICY "Public can view settings"
    ON public.settings
    FOR SELECT
    USING (true);
