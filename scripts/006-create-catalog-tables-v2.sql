-- Tabelas de Catálogo Técnico (Isoladas por Usuário)
-- Cada usuário gerencia seus próprios preços e modelos.

-- 1. Catálogo de Motores
DROP TABLE IF EXISTS public.motor_models;
CREATE TABLE public.motor_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Motor Deslizante 1/4"
  weight_min_kg NUMERIC NOT NULL DEFAULT 0,
  weight_max_kg NUMERIC NOT NULL, -- Ex: 300, 500
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Catálogo de Lâminas
DROP TABLE IF EXISTS public.blade_models;
CREATE TABLE public.blade_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Lâmina Fechada"
  price_per_m2 NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Catálogo de Pinturas
DROP TABLE IF EXISTS public.painting_types;
CREATE TABLE public.painting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Eletrostática Branca"
  price_per_m2 NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.motor_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blade_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painting_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (Usuário vê e edita APENAS seus dados)
-- Motores
CREATE POLICY "Users can view own motors" ON public.motor_models
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own motors" ON public.motor_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own motors" ON public.motor_models
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own motors" ON public.motor_models
  FOR DELETE USING (auth.uid() = user_id);

-- Lâminas
CREATE POLICY "Users can view own blades" ON public.blade_models
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blades" ON public.blade_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blades" ON public.blade_models
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blades" ON public.blade_models
  FOR DELETE USING (auth.uid() = user_id);

-- Pinturas
CREATE POLICY "Users can view own paintings" ON public.painting_types
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own paintings" ON public.painting_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own paintings" ON public.painting_types
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own paintings" ON public.painting_types
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para popular catálogo inicial do usuário (Opcional, mas recomendado)
-- Assim ele não começa com tabelas vazias
CREATE OR REPLACE FUNCTION public.seed_user_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copiar Motores Padrão
  INSERT INTO public.motor_models (user_id, name, weight_max_kg, price) VALUES
  (NEW.id, 'Motor até 200kg', 200, 1200),
  (NEW.id, 'Motor até 300kg', 300, 1300),
  (NEW.id, 'Motor até 400kg', 400, 1400),
  (NEW.id, 'Motor até 500kg', 500, 1500),
  (NEW.id, 'Motor até 600kg', 600, 1600),
  (NEW.id, 'Motor até 800kg', 800, 2700),
  (NEW.id, 'Motor até 1000kg', 1000, 3500),
  (NEW.id, 'Motor até 1500kg', 1500, 6000);

  -- Copiar Lâminas Padrão
  INSERT INTO public.blade_models (user_id, name, price_per_m2) VALUES
  (NEW.id, 'Lâmina Fechada Galvalume', 180),
  (NEW.id, 'Lâmina Perfurada Transvision', 220),
  (NEW.id, 'Lâmina Raiada', 160);

  -- Copiar Pinturas Padrão
  INSERT INTO public.painting_types (user_id, name, price_per_m2) VALUES
  (NEW.id, 'Pintura Eletrostática Padrão', 65),
  (NEW.id, 'Pintura Premium', 90),
  (NEW.id, 'Sem Pintura', 0);

  RETURN NEW;
END;
$$;

-- Adicionar esse trigger ao evento de criação de profile
DROP TRIGGER IF EXISTS on_profile_created_seed_catalog ON public.profiles;
CREATE TRIGGER on_profile_created_seed_catalog
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_user_catalog();
