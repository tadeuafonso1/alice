-- Migration: Add user_id column to settings table
-- Description: Adiciona coluna user_id para vincular configurações ao usuário

-- Adicionar coluna user_id se não existir
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Preencher user_id para linhas existentes (pega o primeiro usuário como fallback)
-- IMPORTANTE: Se você tiver múltiplos usuários, ajuste manualmente depois
UPDATE settings 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Tornar user_id obrigatório
ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Adicionar constraint de unicidade (um settings por usuário)
ALTER TABLE settings ADD CONSTRAINT unique_user_settings UNIQUE(user_id);
