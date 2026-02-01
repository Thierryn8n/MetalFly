-- Tabelas de Catálogo Técnico (Base para o Dashboard)

-- 1. Catálogo de Motores
CREATE TABLE IF NOT EXISTS public.motor_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Ex: "Motor Deslizante 1/4"
  weight_min_kg NUMERIC NOT NULL DEFAULT 0,
  weight_max_kg NUMERIC NOT NULL, -- Ex: 300, 500
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Catálogo de Lâminas
CREATE TABLE IF NOT EXISTS public.blade_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Ex: "Lâmina Fechada", "Lâmina Perfurada"
  price_per_m2 NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Catálogo de Pinturas
CREATE TABLE IF NOT EXISTS public.painting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Ex: "Eletrostática Branca", "Epóxi"
  price_per_m2 NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Leitura pública (ou autenticada), Escrita apenas Admin
ALTER TABLE public.motor_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blade_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painting_types ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura (Todos podem ver os catálogos ativos)
CREATE POLICY "Anyone can view active motors" ON public.motor_models FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active blades" ON public.blade_models FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active paintings" ON public.painting_types FOR SELECT USING (is_active = true);

-- Políticas de Escrita (Apenas Admin Master - simplificado aqui para permitir seed inicial se necessário)
-- Na prática, você pode criar uma função ou policy checando role = 'admin_master'

-- Inserção de Dados Iniciais (Seed) para teste imediato
INSERT INTO public.motor_models (name, weight_max_kg, price) VALUES
('Motor até 200kg', 200, 1200),
('Motor até 300kg', 300, 1300),
('Motor até 400kg', 400, 1400),
('Motor até 500kg', 500, 1500),
('Motor até 600kg', 600, 1600),
('Motor até 800kg', 800, 2700),
('Motor até 1000kg', 1000, 3500),
('Motor até 1500kg', 1500, 6000)
ON CONFLICT DO NOTHING;

INSERT INTO public.blade_models (name, price_per_m2) VALUES
('Lâmina Fechada Galvalume', 180),
('Lâmina Perfurada Transvision', 220),
('Lâmina Raiada', 160)
ON CONFLICT DO NOTHING;

INSERT INTO public.painting_types (name, price_per_m2) VALUES
('Pintura Eletrostática Padrão', 65),
('Pintura Premium', 90),
('Sem Pintura', 0)
ON CONFLICT DO NOTHING;
