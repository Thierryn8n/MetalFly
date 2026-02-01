-- Teste de inserção na tabela budgets
-- Este script pode ser usado para testar a funcionalidade de orçamentos

INSERT INTO public.budgets (
  user_id,
  client_name,
  client_phone,
  gate_width,
  gate_height,
  gate_area,
  gate_weight,
  subtotal,
  profit_margin,
  total_value,
  motor_name,
  motor_price,
  notes,
  items
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Assume que existe pelo menos um usuário
  'Cliente Teste',
  '(11) 99999-9999',
  3.0,
  3.0,
  9.0,
  117.0,
  2500.00,
  10.0,
  2750.00,
  'Motor Deslizante 500kg',
  850.00,
  'Orçamento de teste para validação do sistema',
  '[
    {"name": "Lâminas de Aço", "quantity": 1, "unitPrice": 1200.00, "total": 1200.00, "category": "materiais"},
    {"name": "Pintura", "quantity": 1, "unitPrice": 450.00, "total": 450.00, "category": "serviços"},
    {"name": "Motor Deslizante 500kg", "quantity": 1, "unitPrice": 850.00, "total": 850.00, "category": "componentes"}
  ]'::jsonb
);

-- Verificar se o orçamento foi inserido corretamente
SELECT 
  id,
  client_name,
  client_phone,
  gate_width,
  gate_height,
  total_value,
  created_at
FROM public.budgets 
WHERE client_name = 'Cliente Teste';