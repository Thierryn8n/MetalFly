-- Executar todas as migrações do sistema de anúncios
-- Este script deve ser executado no Supabase para criar o sistema completo

-- 1. Criar tabelas de anúncios
\i 003-create-advertisements.sql

-- 2. Habilitar RLS
\i 004-enable-rls-ads.sql

-- 3. Criar bucket de storage
\i 010-create-storage-bucket.sql

-- 4. Verificar se tudo foi criado corretamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('advertisements', 'ad_impressions', 'ad_clicks');

SELECT bucket_id, name, public 
FROM storage.buckets 
WHERE id = 'advertisements';