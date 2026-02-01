-- 🚀 SCRIPT COMPLETO PARA CORRIGIR RECURSÃO INFINITA NO SUPABASE
-- Execute este script completo no Supabase SQL Editor
-- Ele resolve todos os problemas de recursão RLS identificados

-- ==============================================
-- 1. GARANTIR QUE AS FUNÇÕES DE BYPASS EXISTEM
-- ==============================================

-- Função para buscar perfil com bypass de RLS
CREATE OR REPLACE FUNCTION public.get_user_profile_bypass(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  company text,
  phone text,
  avatar_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    p.company,
    p.phone,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;

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

-- ==============================================
-- 2. CORRIGIR POLÍTICAS RECURSIVAS DE PROFILES
-- ==============================================

-- Remover políticas recursivas existentes
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Criar política não-recursiva para admin usando função SECURITY DEFINER
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- ==============================================
-- 3. CORRIGIR POLÍTICAS RECURSIVAS DE PRODUCTS
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
-- 4. CORRIGIR OUTRAS POLÍTICAS RECURSIVAS
-- ==============================================

-- STORE_ORDERS
DROP POLICY IF EXISTS "Admin can view all store orders" ON store_orders;
DROP POLICY IF EXISTS "Admin can update store orders" ON store_orders;

CREATE POLICY "Admin can view all store orders" ON store_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can update store orders" ON store_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- STORE_ORDER_ITEMS
DROP POLICY IF EXISTS "Admin can view all order items" ON store_order_items;

CREATE POLICY "Admin can view all order items" ON store_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- COURSES
DROP POLICY IF EXISTS "Admin can view all courses" ON courses;
DROP POLICY IF EXISTS "Admin can insert courses" ON courses;
DROP POLICY IF EXISTS "Admin can update courses" ON courses;
DROP POLICY IF EXISTS "Admin can delete courses" ON courses;

CREATE POLICY "Admin can view all courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can insert courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can update courses" ON courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can delete courses" ON courses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- MODULES
DROP POLICY IF EXISTS "Admin can manage modules" ON modules;

CREATE POLICY "Admin can manage modules" ON modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- LESSONS
DROP POLICY IF EXISTS "Admin can manage lessons" ON lessons;

CREATE POLICY "Admin can manage lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- ==============================================
-- 5. GARANTIR PERMISSÕES
-- ==============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_bypass TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO service_role;

-- ==============================================
-- 6. VERIFICAÇÃO FINAL
-- ==============================================

-- Verificar se as políticas foram atualizadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'products')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- Mensagem de sucesso
SELECT '✅ Correção de recursão RLS aplicada com sucesso!' as status;