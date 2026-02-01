-- 🔧 SCRIPT EXECUTÁVEL PARA CORRIGIR RECURSÃO INFINITA - SUPABASE
-- Execute este script no SQL Editor do Supabase para corrigir a recursão

-- ==============================================
-- 1. CRIAR FUNÇÕES SECURITY DEFINER PARA PRODUTOS
-- ==============================================

-- Função para buscar produtos ativos com bypass de RLS
CREATE OR REPLACE FUNCTION public.get_all_active_products_bypass()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  is_active boolean,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.is_active,
    p.image_url,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE p.is_active = true;
END;
$$;

-- Função para buscar produtos por categoria com bypass de RLS
CREATE OR REPLACE FUNCTION public.get_products_by_category_bypass(p_categories text[])
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  is_active boolean,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.is_active,
    p.image_url,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE p.is_active = true 
    AND p.category = ANY(p_categories);
END;
$$;

-- ==============================================
-- 2. CORRIGIR POLÍTICAS RLS RECURSIVAS DE PRODUCTS
-- ==============================================

-- Remover políticas recursivas existentes
DROP POLICY IF EXISTS "Admin can view all products" ON products;
DROP POLICY IF EXISTS "Admin can insert products" ON products;
DROP POLICY IF EXISTS "Admin can update products" ON products;
DROP POLICY IF EXISTS "Admin can delete products" ON products;

-- Criar políticas não-recursivas para admin usando função SECURITY DEFINER
CREATE POLICY "Admin can view all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- ==============================================
-- 3. GARANTIR PERMISSÕES PARA AS FUNÇÕES
-- ==============================================

-- Grant usage on functions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_products_by_category_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_bypass TO authenticated;

-- Grant usage on functions to service_role (for admin operations)
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO service_role;
GRANT EXECUTE ON FUNCTION public.get_products_by_category_bypass TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile_bypass TO service_role;

-- ==============================================
-- 4. TESTAR AS CORREÇÕES
-- ==============================================

-- Testar se a função de bypass está funcionando
SELECT '✅ Função get_user_profile_bypass criada com sucesso' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'get_user_profile_bypass'
);

SELECT '✅ Função get_all_active_products_bypass criada com sucesso' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'get_all_active_products_bypass'
);

SELECT '✅ Função get_products_by_category_bypass criada com sucesso' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'get_products_by_category_bypass'
);

-- Verificar políticas atualizadas
SELECT '✅ Política Admin can view all products atualizada' as status
WHERE EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE tablename = 'products' AND policyname = 'Admin can view all products'
);

-- ==============================================
-- 5. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION public.get_all_active_products_bypass IS 'Função SECURITY DEFINER para buscar produtos ativos bypassando RLS - resolve recursão infinita';
COMMENT ON FUNCTION public.get_products_by_category_bypass IS 'Função SECURITY DEFINER para buscar produtos por categoria bypassando RLS - resolve recursão infinita';
COMMENT ON POLICY "Admin can view all products" ON products IS 'Permite que admins visualizem todos os produtos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can insert products" ON products IS 'Permite que admins criem produtos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can update products" ON products IS 'Permite que admins atualizem produtos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can delete products" ON products IS 'Permite que admins deletem produtos - usa função SECURITY DEFINER para evitar recursão';

-- 🎉 SCRIPT CONCLUÍDO - Recursão deve estar resolvida!