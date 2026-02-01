-- Atualização da tabela orders para suportar todos os campos do relatório/amostra
-- Baseado na análise do arquivo CSV/Prompt do usuário

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT 0, -- Custo de Mão de Obra (implícito no total)
ADD COLUMN IF NOT EXISTS profit_margin_applied DECIMAL(5,2) DEFAULT 0, -- Margem de lucro aplicada (%)
ADD COLUMN IF NOT EXISTS blade_unit_price DECIMAL(10,2) DEFAULT 0, -- Preço unitário da lâmina (VALOR p/m2)
ADD COLUMN IF NOT EXISTS blade_total_cost DECIMAL(10,2) DEFAULT 0, -- Custo total da lâmina (total calculado)
ADD COLUMN IF NOT EXISTS painting_unit_price DECIMAL(10,2) DEFAULT 0; -- Preço unitário da pintura

-- Comentários para documentação
COMMENT ON COLUMN orders.blade_unit_price IS 'Preço por m2 da lâmina aplicado no momento do pedido';
COMMENT ON COLUMN orders.blade_total_cost IS 'Custo total da lâmina (Area * Unit Price)';
COMMENT ON COLUMN orders.labor_cost IS 'Custo calculado de mão de obra';
COMMENT ON COLUMN orders.profit_margin_applied IS 'Porcentagem de margem de lucro aplicada sobre o subtotal';
