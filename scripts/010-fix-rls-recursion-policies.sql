-- Script para corrigir recursão infinita nas políticas RLS
-- Substitui as políticas recursivas por versões que usam funções SECURITY DEFINER

-- ==============================================
-- POLÍTICAS DE PROFILES - CORREÇÃO DE RECURSÃO
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
-- POLÍTICAS DE PRODUCTS - CORREÇÃO DE RECURSÃO
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
-- POLÍTICAS DE STORE_ORDERS - CORREÇÃO DE RECURSÃO
-- ==============================================

-- Remover políticas recursivas existentes
DROP POLICY IF EXISTS "Admin can view all store orders" ON store_orders;
DROP POLICY IF EXISTS "Admin can update store orders" ON store_orders;

-- Criar políticas não-recursivas para admin usando função SECURITY DEFINER
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

-- ==============================================
-- POLÍTICAS DE STORE_ORDER_ITEMS - CORREÇÃO DE RECURSÃO
-- ==============================================

-- Remover políticas recursivas existentes
DROP POLICY IF EXISTS "Admin can view all order items" ON store_order_items;

-- Criar política não-recursiva para admin usando função SECURITY DEFINER
CREATE POLICY "Admin can view all order items" ON store_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- ==============================================
-- POLÍTICAS DE COURSES - CORREÇÃO DE RECURSÃO
-- ==============================================

-- Remover políticas recursivas existentes
DROP POLICY IF EXISTS "Admin can view all courses" ON courses;
DROP POLICY IF EXISTS "Admin can insert courses" ON courses;
DROP POLICY IF EXISTS "Admin can update courses" ON courses;
DROP POLICY IF EXISTS "Admin can delete courses" ON courses;

-- Criar políticas não-recursivas para admin usando função SECURITY DEFINER
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

-- ==============================================
-- POLÍTICAS DE MODULES - CORREÇÃO DE RECURSÃO
-- ==============================================

-- Remover políticas recursivas existentes
DROP POLICY IF EXISTS "Admin can manage modules" ON modules;

-- Criar política não-recursiva para admin usando função SECURITY DEFINER
CREATE POLICY "Admin can manage modules" ON modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- ==============================================
-- POLÍTICAS DE LESSONS - CORREÇÃO DE RECURSÃO
-- ==============================================

-- Remover políticas recursivas existentes
DROP POLICY IF EXISTS "Admin can manage lessons" ON lessons;

-- Criar política não-recursiva para admin usando função SECURITY DEFINER
CREATE POLICY "Admin can manage lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- ==============================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ==============================================

COMMENT ON POLICY "Admin can view all profiles" ON profiles IS 'Permite que admins visualizem todos os perfis - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can view all products" ON products IS 'Permite que admins visualizem todos os produtos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can insert products" ON products IS 'Permite que admins criem produtos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can update products" ON products IS 'Permite que admins atualizem produtos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can delete products" ON products IS 'Permite que admins deletem produtos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can view all store orders" ON store_orders IS 'Permite que admins visualizem todos os pedidos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can update store orders" ON store_orders IS 'Permite que admins atualizem todos os pedidos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can view all order items" ON store_order_items IS 'Permite que admins visualizem todos os itens de pedidos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can view all courses" ON courses IS 'Permite que admins visualizem todos os cursos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can insert courses" ON courses IS 'Permite que admins criem cursos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can update courses" ON courses IS 'Permite que admins atualizem cursos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can delete courses" ON courses IS 'Permite que admins deletem cursos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can manage modules" ON modules IS 'Permite que admins gerenciem módulos - usa função SECURITY DEFINER para evitar recursão';
COMMENT ON POLICY "Admin can manage lessons" ON lessons IS 'Permite que admins gerenciem lições - usa função SECURITY DEFINER para evitar recursão';