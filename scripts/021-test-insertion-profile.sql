-- Testar inserção manual com user_id fixo para verificar se o problema é RLS
-- Use o ID do seu usuário de teste

-- Primeiro, verificar qual é o seu user_id
SELECT id, email, full_name 
FROM public.profiles 
LIMIT 5;

-- Substituir 'SEU_USER_ID_AQUI' pelo ID real do seu usuário
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
  'Teste de inserção manual com user_id fixo',
  2750.00,
  'draft'
);

-- Verificar se a inserção funcionou
SELECT * FROM public.orders 
WHERE client_name = 'Cliente Teste' 
ORDER BY created_at DESC 
LIMIT 1;