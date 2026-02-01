-- Sistema de Anúncios - Metal Fly
-- Script completo para criar o sistema de anúncios

-- 1. Tabela de Anúncios
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Tipo de conteúdo
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'html')),
  image_url TEXT,
  video_url TEXT,
  html_content TEXT,
  
  -- Posicionamento
  position TEXT NOT NULL CHECK (position IN ('calculator_header_right', 'calculator_sidebar', 'calculator_footer', 'dashboard_sidebar', 'dashboard_header', 'store_banner', 'academy_banner')),
  
  -- Dimensões (em pixels ou porcentagem)
  width TEXT DEFAULT 'auto',
  height TEXT DEFAULT 'auto',
  
  -- Tipo de anúncio (loja ou escola)
  ad_type TEXT NOT NULL CHECK (ad_type IN ('store', 'academy', 'both')),
  
  -- Categoria de produto/curso relacionado
  related_category TEXT,
  
  -- URLs de ação
  action_url TEXT,
  action_text TEXT DEFAULT 'Saiba Mais',
  
  -- Status e visibilidade
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  
  -- Ordem de exibição
  display_order INTEGER DEFAULT 0,
  
  -- Métricas
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  
  -- Metadados
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Exibições
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Cliques
CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(position);
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_type ON advertisements(ad_type);
CREATE INDEX IF NOT EXISTS idx_advertisements_dates ON advertisements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_id ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user_id ON ad_clicks(user_id);

-- Funções para contadores
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advertisements 
  SET impressions_count = impressions_count + 1 
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advertisements 
  SET clicks_count = clicks_count + 1 
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Políticas para advertisements
CREATE POLICY "Anúncios ativos são visíveis para todos" ON advertisements
  FOR SELECT USING (is_active = true AND (end_date IS NULL OR end_date > NOW()));

CREATE POLICY "Admin pode ver todos os anúncios" ON advertisements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

CREATE POLICY "Admin pode criar anúncios" ON advertisements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

CREATE POLICY "Admin pode atualizar anúncios" ON advertisements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

CREATE POLICY "Admin pode deletar anúncios" ON advertisements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

-- Políticas para analytics
CREATE POLICY "Todos podem registrar impressões" ON ad_impressions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin pode ver impressões" ON ad_impressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

CREATE POLICY "Todos podem registrar cliques" ON ad_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin pode ver cliques" ON ad_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

-- Criar bucket de storage para anúncios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('advertisements', 'advertisements', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- RLS para storage
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'advertisements' AND auth.uid() = owner);

CREATE POLICY "Usuários autenticados podem atualizar seus arquivos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'advertisements' AND auth.uid() = owner);

CREATE POLICY "Usuários autenticados podem deletar seus arquivos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'advertisements' AND auth.uid() = owner);

CREATE POLICY "Arquivos públicos são legíveis" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'advertisements');

-- Função para gerar URL pública
CREATE OR REPLACE FUNCTION get_advertisement_file_url(file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN storage.extension('advertisements', file_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar criação
SELECT 'Tabela advertisements criada com sucesso!' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'advertisements');

SELECT 'Bucket advertisements criado com sucesso!' as status
WHERE EXISTS (SELECT 1 FROM storage.buckets 
              WHERE id = 'advertisements');