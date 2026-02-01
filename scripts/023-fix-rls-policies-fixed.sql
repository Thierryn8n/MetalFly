-- Script para testar RLS com user_id fixo (sem auth.uid())
-- Use este script quando não houver sessão ativa

-- Primeiro, verificar qual é o seu user_id
SELECT id, email, full_name 
FROM public.profiles 
LIMIT 5;

-- Copie o ID do seu usuário e substitua no lugar de 'SEU_USER_ID_AQUI'

-- Verificar estado atual das políticas RLS na tabela orders
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
    relname, 
    relrowsecurity 
FROM pg_class 
WHERE relname = 'orders';

-- Se RLS não estiver habilitado, habilitar
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas se não existirem (com IF NOT EXISTS)

-- Política para INSERT: usuários podem inserir apenas seus próprios orçamentos
CREATE POLICY IF NOT EXISTS "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para SELECT: usuários podem ver apenas seus próprios orçamentos
CREATE POLICY IF NOT EXISTS "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas seus próprios orçamentos
CREATE POLICY IF NOT EXISTS "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas seus próprios orçamentos
CREATE POLICY IF NOT EXISTS "Users can delete their own orders" ON public.orders
    FOR DELETE USING (auth.uid() = user_id);

-- Verificar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;

-- Teste de inserção com user_id fixo (substitua 'SEU_USER_ID_AQUI' pelo ID real)
-- DESCOMENTE E USE SEU ID REAL:
/*
INSERT INTO public.orders (
  user_id,
  client_name,
  client_phone,
  width,
  height,
  area,
  weight,
  blade_price_applied,
  painting_price_total,
  motor_cost,
  motor_model,
  additional_cost,
  additional_notes,
  total_price,
  status
) VALUES (
  'SEU_USER_ID_AQUI', -- Substitua pelo ID do seu usuário
  'Cliente Teste RLS',
  '(11) 99999-9999',
  3.0,
  3.0,
  9.0,
  117.0,
  1200.00,
  450.00,
  850.00,
  'Motor PPA 1/4 HP',
  450.00,
  'Teste de inserção com RLS',
  2750.00,
  'draft'
);
*/

-- Verificar se a inserção funcionou (descomente após inserir)
-- SELECT * FROM public.orders 
-- WHERE client_name = 'Cliente Teste RLS' 
-- ORDER BY created_at DESC 
-- LIMIT 1;