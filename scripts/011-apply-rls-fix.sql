-- Script executável para corrigir recursão infinita nas políticas RLS
-- Execute este script no Supabase SQL Editor

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
-- VERIFICAÇÃO DA CORREÇÃO
-- ==============================================

-- Verificar se as políticas foram atualizadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'products')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- Testar se a função de bypass está funcionando
-- SELECT * FROM public.get_user_profile_bypass(auth.uid());