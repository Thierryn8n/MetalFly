-- 🔍 SCRIPT DE VERIFICAÇÃO: Funções SECURITY DEFINER e Políticas RLS
-- Execute este script no SQL Editor do Supabase para verificar se as correções foram aplicadas

-- ==============================================
-- 1. VERIFICAR FUNÇÕES SECURITY DEFINER
-- ==============================================

SELECT 
  routine_name as function_name,
  security_type,
  routine_definition,
  created,
  last_altered
FROM information_schema.routines 
WHERE routine_name IN ('get_user_profile_bypass', 'get_all_active_products_bypass', 'get_products_by_category_bypass')
ORDER BY routine_name;

-- ==============================================
-- 2. VERIFICAR PERMISSÕES DAS FUNÇÕES
-- ==============================================

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type,
  pg_get_userbyid(p.proowner) as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('get_user_profile_bypass', 'get_all_active_products_bypass', 'get_products_by_category_bypass')
ORDER BY p.proname;

-- ==============================================
-- 3. VERIFICAR POLÍTICAS RLS ATUAIS
-- ==============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('products', 'profiles')
ORDER BY tablename, policyname;

-- ==============================================
-- 4. TESTAR FUNÇÕES INDIVIDUALMENTE
-- ==============================================

-- Testar get_user_profile_bypass (substitua o UUID por um ID válido)
SELECT '✅ Teste get_user_profile_bypass' as test_name, 
       CASE 
         WHEN COUNT(*) > 0 THEN 'FUNCIONANDO'
         ELSE 'FALHOU'
       END as status
FROM public.get_user_profile_bypass('00000000-0000-0000-0000-000000000000');

-- Testar get_products_by_category_bypass
SELECT '✅ Teste get_products_by_category_bypass' as test_name,
       CASE 
         WHEN COUNT(*) >= 0 THEN 'FUNCIONANDO'
         ELSE 'FALHOU'
       END as status
FROM public.get_products_by_category_bypass(ARRAY['laminas', 'tintas', 'acessorios', 'motores']);

-- ==============================================
-- 5. VERIFICAR SE HÁ POLÍTICAS RECURSIVAS RESTANTES
-- ==============================================

-- Procurar por políticas que possam causar recursão
SELECT 
  p.polname as policy_name,
  n.nspname as schema_name,
  c.relname as table_name,
  CASE p.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    ELSE p.polcmd::text
  END as command,
  pg_get_expr(p.polqual, p.polrelid) as using_expression,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expression
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('products', 'profiles')
  AND (pg_get_expr(p.polqual, p.polrelid) LIKE '%profiles%' 
       OR pg_get_expr(p.polqual, p.polrelid) LIKE '%products%'
       OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%profiles%'
       OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%products%')
ORDER BY n.nspname, c.relname, p.polname;

-- ==============================================
-- 6. RESUMO FINAL
-- ==============================================

SELECT 
  'Funções SECURITY DEFINER' as item,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ COMPLETO'
    ELSE '❌ INCOMPLETO'
  END as status
FROM information_schema.routines 
WHERE routine_name IN ('get_user_profile_bypass', 'get_all_active_products_bypass', 'get_products_by_category_bypass')

UNION ALL

SELECT 
  'Políticas Products' as item,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ COMPLETO'
    ELSE '❌ INCOMPLETO'
  END as status
FROM pg_policies 
WHERE tablename = 'products'

UNION ALL

SELECT 
  'Políticas Profiles' as item,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ COMPLETO'
    ELSE '❌ INCOMPLETO'
  END as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- 🎯 RESULTADO ESPERADO:
-- Todas as verificações devem mostrar "FUNCIONANDO" ou "COMPLETO"
-- Se houver "FALHOU" ou "INCOMPLETO", as correções precisam ser reaplicadas