-- Verificar status da tabela orders e RLS

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';

-- Verificar políticas existentes
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles,
    polqual as using_expression,
    polwithcheck as with_check_expression
FROM pg_policy 
WHERE polrelid = 'public.orders'::regclass;

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- Testar inserção manual com um usuário específico
-- Substitua 'seu-user-id-aqui' pelo ID real do usuário logado
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
  auth.uid(), -- ou 'seu-user-id-aqui'
  'Teste Manual',
  '(11) 99999-9999',
  3.0,
  3.0,
  9.0,
  117.0,
  1200.00,
  450.00,
  850.00,
  'Motor Teste',
  450.00,
  'Teste manual de inserção',
  2750.00,
  'draft'
);