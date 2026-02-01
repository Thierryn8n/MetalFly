-- Sistema de Anúncios - Metal Fly (VERSÃO SEGURA)
-- Script completo com verificações IF NOT EXISTS para evitar erros de duplicação

-- 1. Tabela de Anúncios (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' 
                 AND table_name = 'advertisements') THEN
    
    CREATE TABLE advertisements (
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
      created_by UUID, -- Sem FK para evitar recursão RLS
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabela advertisements criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela advertisements já existe, pulando criação.';
  END IF;
END $$;

-- 2. Tabela de Exibições (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' 
                 AND table_name = 'ad_impressions') THEN
    
    CREATE TABLE ad_impressions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
      user_id UUID, -- Sem FK para evitar recursão RLS
      page_url TEXT NOT NULL,
      ip_address INET,
      user_agent TEXT,
      viewed_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabela ad_impressions criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela ad_impressions já existe, pulando criação.';
  END IF;
END $$;

-- 3. Tabela de Cliques (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' 
                 AND table_name = 'ad_clicks') THEN
    
    CREATE TABLE ad_clicks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
      user_id UUID, -- Sem FK para evitar recursão RLS
      page_url TEXT NOT NULL,
      ip_address INET,
      user_agent TEXT,
      clicked_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabela ad_clicks criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela ad_clicks já existe, pulando criação.';
  END IF;
END $$;

-- 4. Índices (apenas se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advertisements_position') THEN
    CREATE INDEX idx_advertisements_position ON advertisements(position);
    RAISE NOTICE 'Índice idx_advertisements_position criado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advertisements_active') THEN
    CREATE INDEX idx_advertisements_active ON advertisements(is_active);
    RAISE NOTICE 'Índice idx_advertisements_active criado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advertisements_type') THEN
    CREATE INDEX idx_advertisements_type ON advertisements(ad_type);
    RAISE NOTICE 'Índice idx_advertisements_type criado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advertisements_dates') THEN
    CREATE INDEX idx_advertisements_dates ON advertisements(start_date, end_date);
    RAISE NOTICE 'Índice idx_advertisements_dates criado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_impressions_ad_id') THEN
    CREATE INDEX idx_ad_impressions_ad_id ON ad_impressions(advertisement_id);
    RAISE NOTICE 'Índice idx_ad_impressions_ad_id criado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_impressions_user_id') THEN
    CREATE INDEX idx_ad_impressions_user_id ON ad_impressions(user_id);
    RAISE NOTICE 'Índice idx_ad_impressions_user_id criado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_clicks_ad_id') THEN
    CREATE INDEX idx_ad_clicks_ad_id ON ad_clicks(advertisement_id);
    RAISE NOTICE 'Índice idx_ad_clicks_ad_id criado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_clicks_user_id') THEN
    CREATE INDEX idx_ad_clicks_user_id ON ad_clicks(user_id);
    RAISE NOTICE 'Índice idx_ad_clicks_user_id criado.';
  END IF;
END $$;

-- 5. Funções para contadores (apenas se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_ad_impressions') THEN
    
    EXECUTE '
    CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id UUID)
    RETURNS VOID AS $func$
    BEGIN
      UPDATE advertisements 
      SET impressions_count = impressions_count + 1 
      WHERE id = ad_id;
    END;
    $func$ LANGUAGE plpgsql;';
    
    RAISE NOTICE 'Função increment_ad_impressions criada.';
  ELSE
    RAISE NOTICE 'Função increment_ad_impressions já existe.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_ad_clicks') THEN
    
    EXECUTE '
    CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
    RETURNS VOID AS $func$
    BEGIN
      UPDATE advertisements 
      SET clicks_count = clicks_count + 1 
      WHERE id = ad_id;
    END;
    $func$ LANGUAGE plpgsql;';
    
    RAISE NOTICE 'Função increment_ad_clicks criada.';
  ELSE
    RAISE NOTICE 'Função increment_ad_clicks já existe.';
  END IF;
END $$;

-- 6. RLS Policies para tabelas (apenas se não existirem)
DO $$
BEGIN
  -- Habilitar RLS apenas se ainda não estiver habilitada
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'advertisements') THEN
    ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitada na tabela advertisements.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_impressions') THEN
    ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitada na tabela ad_impressions.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_clicks') THEN
    ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitada na tabela ad_clicks.';
  END IF;
END $$;

-- 7. Políticas específicas (apenas se não existirem)
DO $$
BEGIN
  -- Política: Anúncios ativos são visíveis para todos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anúncios ativos são visíveis para todos' AND tablename = 'advertisements') THEN
    CREATE POLICY "Anúncios ativos são visíveis para todos" ON advertisements
      FOR SELECT USING (is_active = true AND (end_date IS NULL OR end_date > NOW()));
    RAISE NOTICE 'Política de visualização de anúncios ativos criada.';
  END IF;
  
  -- Política: Admin pode ver todos os anúncios
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin pode ver todos os anúncios' AND tablename = 'advertisements') THEN
    CREATE POLICY "Admin pode ver todos os anúncios" ON advertisements
      FOR SELECT USING (
        (auth.jwt() ->> 'user_role') = 'admin_master'
      );
    RAISE NOTICE 'Política admin de visualização criada.';
  END IF;
  
  -- Política: Admin pode criar anúncios
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin pode criar anúncios' AND tablename = 'advertisements') THEN
    CREATE POLICY "Admin pode criar anúncios" ON advertisements
      FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'user_role') = 'admin_master'
      );
    RAISE NOTICE 'Política admin de inserção criada.';
  END IF;
  
  -- Política: Admin pode atualizar anúncios
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin pode atualizar anúncios' AND tablename = 'advertisements') THEN
    CREATE POLICY "Admin pode atualizar anúncios" ON advertisements
      FOR UPDATE USING (
        (auth.jwt() ->> 'user_role') = 'admin_master'
      );
    RAISE NOTICE 'Política admin de atualização criada.';
  END IF;
  
  -- Política: Admin pode deletar anúncios
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin pode deletar anúncios' AND tablename = 'advertisements') THEN
    CREATE POLICY "Admin pode deletar anúncios" ON advertisements
      FOR DELETE USING (
        (auth.jwt() ->> 'user_role') = 'admin_master'
      );
    RAISE NOTICE 'Política admin de exclusão criada.';
  END IF;
  
  -- Políticas para ad_impressions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Todos podem registrar impressões' AND tablename = 'ad_impressions') THEN
    CREATE POLICY "Todos podem registrar impressões" ON ad_impressions
      FOR INSERT WITH CHECK (true);
    RAISE NOTICE 'Política de inserção de impressões criada.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin pode ver impressões' AND tablename = 'ad_impressions') THEN
    CREATE POLICY "Admin pode ver impressões" ON ad_impressions
      FOR SELECT USING (
        (auth.jwt() ->> 'user_role') = 'admin_master'
      );
    RAISE NOTICE 'Política admin de visualização de impressões criada.';
  END IF;
  
  -- Políticas para ad_clicks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Todos podem registrar cliques' AND tablename = 'ad_clicks') THEN
    CREATE POLICY "Todos podem registrar cliques" ON ad_clicks
      FOR INSERT WITH CHECK (true);
    RAISE NOTICE 'Política de inserção de cliques criada.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin pode ver cliques' AND tablename = 'ad_clicks') THEN
    CREATE POLICY "Admin pode ver cliques" ON ad_clicks
      FOR SELECT USING (
        (auth.jwt() ->> 'user_role') = 'admin_master'
      );
    RAISE NOTICE 'Política admin de visualização de cliques criada.';
  END IF;
END $$;

-- 8. Bucket de Storage (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'advertisements') THEN
    
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('advertisements', 'advertisements', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']);
    
    RAISE NOTICE 'Bucket advertisements criado com sucesso!';
  ELSE
    RAISE NOTICE 'Bucket advertisements já existe, pulando criação.';
  END IF;
END $$;

-- 9. Políticas de Storage (apenas se não existirem)
DO $$
BEGIN
  -- Política: Usuários autenticados podem fazer upload
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários autenticados podem fazer upload' AND tablename = 'objects') THEN
    CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'advertisements' AND auth.uid() = owner);
    RAISE NOTICE 'Política de upload criada.';
  END IF;
  
  -- Política: Usuários autenticados podem atualizar seus arquivos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários autenticados podem atualizar seus arquivos' AND tablename = 'objects') THEN
    CREATE POLICY "Usuários autenticados podem atualizar seus arquivos" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'advertisements' AND auth.uid() = owner);
    RAISE NOTICE 'Política de atualização criada.';
  END IF;
  
  -- Política: Usuários autenticados podem deletar seus arquivos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários autenticados podem deletar seus arquivos' AND tablename = 'objects') THEN
    CREATE POLICY "Usuários autenticados podem deletar seus arquivos" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'advertisements' AND auth.uid() = owner);
    RAISE NOTICE 'Política de exclusão criada.';
  END IF;
  
  -- Política: Arquivos públicos são legíveis
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Arquivos públicos são legíveis' AND tablename = 'objects') THEN
    CREATE POLICY "Arquivos públicos são legíveis" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'advertisements');
    RAISE NOTICE 'Política de leitura pública criada.';
  END IF;
END $$;

-- 9.5 Validações manuais para substituir FKs (sem recursão)
DO $$
BEGIN
  -- Validação manual para created_by em advertisements
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_advertisement_created_by') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION validate_advertisement_created_by()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.created_by IS NOT NULL THEN
        -- Verifica se o usuário existe sem causar recursão
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.created_by) THEN
          RAISE EXCEPTION ''Usuário criador não existe: %'', NEW.created_by;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;';
    
    -- Cria trigger para validação
    EXECUTE '
    CREATE TRIGGER trg_validate_advertisement_created_by
      BEFORE INSERT OR UPDATE ON advertisements
      FOR EACH ROW
      EXECUTE FUNCTION validate_advertisement_created_by();';
    
    RAISE NOTICE 'Função de validação created_by criada.';
  END IF;
  
  -- Validação manual para user_id em ad_impressions
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_impression_user') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION validate_impression_user()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.user_id IS NOT NULL THEN
        -- Verifica se o usuário existe sem causar recursão
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
          RAISE EXCEPTION ''Usuário de impressão não existe: %'', NEW.user_id;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;';
    
    -- Cria trigger para validação
    EXECUTE '
    CREATE TRIGGER trg_validate_impression_user
      BEFORE INSERT OR UPDATE ON ad_impressions
      FOR EACH ROW
      EXECUTE FUNCTION validate_impression_user();';
    
    RAISE NOTICE 'Função de validação user_id em impressões criada.';
  END IF;
  
  -- Validação manual para user_id em ad_clicks
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_click_user') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION validate_click_user()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.user_id IS NOT NULL THEN
        -- Verifica se o usuário existe sem causar recursão
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
          RAISE EXCEPTION ''Usuário de clique não existe: %'', NEW.user_id;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;';
    
    -- Cria trigger para validação
    EXECUTE '
    CREATE TRIGGER trg_validate_click_user
      BEFORE INSERT OR UPDATE ON ad_clicks
      FOR EACH ROW
      EXECUTE FUNCTION validate_click_user();';
    
    RAISE NOTICE 'Função de validação user_id em cliques criada.';
  END IF;
END $$;

-- 10. Verificação final
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Tabela advertisements existe e está configurada!'
    ELSE '❌ Tabela advertisements NÃO existe'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'advertisements';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Bucket advertisements existe e está configurado!'
    ELSE '❌ Bucket advertisements NÃO existe'
  END as status
FROM storage.buckets 
WHERE id = 'advertisements';

-- Mostrar políticas criadas
SELECT 'Políticas de advertisements:' as info;
SELECT policyname as policy_name 
FROM pg_policies 
WHERE tablename = 'advertisements' 
ORDER BY policyname;

SELECT 'Políticas de storage.objects:' as info;
SELECT policyname as policy_name 
FROM pg_policies 
WHERE tablename = 'objects' 
AND (policyname LIKE '%upload%' OR policyname LIKE '%atualizar%' OR policyname LIKE '%deletar%' OR policyname LIKE '%legíveis%')
ORDER BY policyname;