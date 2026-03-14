-- Adicionar colunas para a URL de audio na tabela settings para cada tipo de alerta
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS alert_audio_subscriber TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS alert_audio_member TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS alert_audio_superchat TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS alert_audio_donation TEXT;

-- Criação do Bucket de Storage para os sons (Se não existir)
-- Como isso pode dar erro dependendo do setup, envolvemos num bloco PL/PGSQL seguro
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('alert_sounds', 'alert_sounds', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Permitir acesso público de LEITURA aos arquivos
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'alert_sounds');

-- Permitir que os usuários autenticados FAÇAM UPLOAD (somente para eles mesmos baseado na pasta)
CREATE POLICY "Users can upload their own sounds" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'alert_sounds' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir que os usuários ATUALIZEM seus próprios arquivos
CREATE POLICY "Users can update their own sounds"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'alert_sounds' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir que os usuários DELETEM seus próprios arquivos
CREATE POLICY "Users can delete their own sounds"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'alert_sounds' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
