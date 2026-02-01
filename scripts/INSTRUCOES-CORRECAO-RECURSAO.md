# 📋 INSTRUÇÕES PARA APLICAR CORREÇÕES DE RECURSÃO RLS NO SUPABASE

## 🚨 Problema Identificado
O erro de recursão infinita (código 42P17) está ocorrendo devido a políticas RLS (Row Level Security) recursivas no banco de dados Supabase.

## 🔧 Solução: Aplicar Correções via Supabase Studio

### Passo 1: Acessar o Supabase Studio
1. Acesse: https://app.supabase.com
2. Faça login com suas credenciais
3. Selecione o projeto "metal-fly-app" (URL: https://mzllmghqlukjwxvvgwat.supabase.co)

### Passo 2: Executar o Script SQL
1. No menu lateral, clique em "SQL Editor"
2. Crie uma nova query clicando em "New query"
3. Copie e cole o script completo abaixo
4. Clique em "Run" ou pressione Ctrl+Enter

### 📜 Script SQL Completo para Correção de Recursão

```sql
-- 🚀 SCRIPT COMPLETO PARA CORRIGIR RECURSÃO INFINITA NO SUPABASE
-- Execute este script no SQL Editor do Supabase para resolver todos os problemas de recursão

-- ==============================================
-- 1. CRIAR FUNÇÃO DE BYPASS PARA PERFIS
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

-- ==============================================
-- 2. CRIAR FUNÇÕES DE BYPASS PARA PRODUTOS
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
-- 3. REMOVER POLÍTICAS RLS RECURSIVAS EXISTENTES
-- ==============================================

-- Remover políticas recursivas de products
DROP POLICY IF EXISTS "Users can view active products" ON products;
DROP POLICY IF EXISTS "Admin can view all products" ON products;
DROP POLICY IF EXISTS "Admin can insert products" ON products;
DROP POLICY IF EXISTS "Admin can update products" ON products;
DROP POLICY IF EXISTS "Admin can delete products" ON products;

-- Remover políticas recursivas de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

-- ==============================================
-- 4. CRIAR NOVAS POLÍTICAS RLS NÃO-RECURSIVAS
-- ==============================================

-- Políticas para products (usando funções SECURITY DEFINER)
CREATE POLICY "Users can view active products" ON products
  FOR SELECT USING (
    is_active = true
  );

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

-- Políticas para profiles (usando funções SECURITY DEFINER)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
  );

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile_bypass(auth.uid()) 
      WHERE role = 'admin_master'
    )
  );

-- ==============================================
-- 5. GARANTIR PERMISSÕES PARA AS FUNÇÕES
-- ==============================================

-- Grant usage on functions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_products_by_category_bypass TO authenticated;

-- Grant usage on functions to service_role (for admin operations)
GRANT EXECUTE ON FUNCTION public.get_user_profile_bypass TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO service_role;
GRANT EXECUTE ON FUNCTION public.get_products_by_category_bypass TO service_role;

-- ==============================================
-- 6. VERIFICAR A INSTALAÇÃO
-- ==============================================

-- Testar se as funções foram criadas corretamente
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
SELECT '✅ Políticas RLS de products atualizadas' as status
WHERE EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE tablename = 'products' AND policyname = 'Users can view active products'
);

SELECT '✅ Políticas RLS de profiles atualizadas' as status
WHERE EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
);

-- ==============================================
-- 7. ADICIONAR DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION public.get_user_profile_bypass IS 'Função SECURITY DEFINER para buscar perfil bypassando RLS - resolve recursão infinita';
COMMENT ON FUNCTION public.get_all_active_products_bypass IS 'Função SECURITY DEFINER para buscar produtos ativos bypassando RLS - resolve recursão infinita';
COMMENT ON FUNCTION public.get_products_by_category_bypass IS 'Função SECURITY DEFINER para buscar produtos por categoria bypassando RLS - resolve recursão infinita';

-- 🎉 SCRIPT CONCLUÍDO - Recursão deve estar resolvida!
-- Agora você pode testar se as correções funcionam usando o painel de teste na calculadora.
```

### Passo 3: Testar as Correções
1. Acesse a calculadora em: http://localhost:3000/dashboard/calculator
2. O painel de teste de recursão está integrado na página
3. Clique em "Executar Testes de Recursão" para verificar se as correções funcionaram
4. Se os testes passarem (✅), a recursão foi resolvida com sucesso!

### 🎯 Resultado Esperado
- ✅ Os testes de recursão devem passar sem erros
- ✅ A calculadora deve carregar produtos sem o erro 42P17
- ✅ O app deve funcionar normalmente sem travamentos

### 📞 Se ainda houver problemas
Se os testes falharem ou o erro persistir:
1. Verifique o console do navegador para mensagens de erro
2. Confirme que o script SQL foi executado completamente
3. Verifique se as funções foram criadas no banco
4. Teste manualmente as funções no SQL Editor

---

**Status das Correções:** 📋 Pronto para execução
**Local:** Supabase Studio → SQL Editor
**Impacto:** Resolverá o erro de recursão infinita (42P17) na calculadora