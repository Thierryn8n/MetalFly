-- 🔧 SCRIPT EXECUTÁVEL PARA CORRIGIR RECURSÃO INFINITA - SUPABASE
-- Execute este script no SQL Editor do Supabase para corrigir a recursão

-- ==============================================
-- 0. DESATIVAR POLÍTICAS RECURSIVAS TEMPORARIAMENTE
-- ==============================================

-- Desativar RLS nas tabelas críticas temporariamente
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

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
-- 2. CORRIGIR POLÍTICAS RLS RECURSIVAS
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
-- 3. PERMISSÕES PARA AS NOVAS FUNÇÕES
-- ==============================================

-- Grant usage on functions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_products_by_category_bypass TO authenticated;

-- Grant usage on functions to service_role (for admin operations)
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO service_role;
GRANT EXECUTE ON FUNCTION public.get_products_by_category_bypass TO service_role;

-- ==============================================
-- 4. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION public.get_all_active_products_bypass IS 'Função SECURITY DEFINER para buscar produtos ativos bypassando RLS - resolve recursão infinita';
COMMENT ON FUNCTION public.get_products_by_category_bypass IS 'Função SECURITY DEFINER para buscar produtos por categoria bypassando RLS - resolve recursão infinita';

-- ==============================================
-- 5. REATIVAR RLS COM AS NOVAS POLÍTICAS
-- ==============================================

-- Reativar RLS nas tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 6. VERIFICAR A INSTALAÇÃO
-- ==============================================

-- Verificar se as funções foram criadas corretamente
SELECT 
  routine_name,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%bypass%'
ORDER BY routine_name;

-- Testar a função (opcional - descomente para testar)
-- SELECT * FROM public.get_products_by_category_bypass(ARRAY['laminas', 'tintas', 'acessorios', 'motores']);