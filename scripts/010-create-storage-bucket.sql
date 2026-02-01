-- Criar bucket de storage para anúncios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisements',
  'advertisements', 
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket de anúncios
-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'advertisements' AND
  auth.uid() = owner
);

-- Permitir visualização pública (bucket é público)
CREATE POLICY "Visualização pública de arquivos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'advertisements');

-- Permitir update para o próprio usuário
CREATE POLICY "Usuários podem atualizar seus arquivos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'advertisements' AND
  auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'advertisements' AND
  auth.uid() = owner
);

-- Permitir delete para o próprio usuário
CREATE POLICY "Usuários podem deletar seus arquivos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'advertisements' AND
  auth.uid() = owner
);

-- Função auxiliar para gerar URLs públicas
CREATE OR REPLACE FUNCTION get_advertisement_media_url(file_path text)
RETURNS text AS $$
BEGIN
  RETURN 'https://mzllmghqlukjwxvvgwat.supabase.co/storage/v1/object/public/advertisements/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;