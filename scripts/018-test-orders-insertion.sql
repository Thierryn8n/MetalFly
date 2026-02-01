-- Teste de inserção na tabela orders existente
-- Este script testa a inserção de um orçamento com os campos corretos da tabela orders

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
  (SELECT id FROM auth.users LIMIT 1),
  'Cliente Teste Silva',
  '(11) 99999-9999',
  3.5,
  3.2,
  11.2,
  145.6,
  1500.00,
  600.00,
  850.00,
  'Motor Deslizante 500kg',
  450.00,
 'Orçamento de teste para validação do sistema - inclui lâminas de aço, pintura, motor e mão de obra',
  3400.00,
  'draft'
);

-- Verificar a inserção
SELECT 
  id,
  client_name,
  client_phone,
  width,
  height,
  area,
  total_price,
  status,
  created_at
FROM public.orders 
WHERE client_name = 'Cliente Teste Silva';