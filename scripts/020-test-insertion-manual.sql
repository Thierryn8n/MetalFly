-- Testar inserção manual com dados completos
-- Use este script para testar se a inserção está funcionando

-- Verificar estrutura da tabela
\d public.orders

-- Verificar RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';

-- Listar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Testar inserção com auth.uid()
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
  auth.uid(),
  'Cliente Teste',
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
  'Teste de inserção manual',
  2750.00,
  'draft'
);

-- Se der erro, mostrar qual é
-- Se funcionar, verificar os dados inseridos
SELECT * FROM public.orders WHERE client_name = 'Cliente Teste' ORDER BY created_at DESC LIMIT 1;