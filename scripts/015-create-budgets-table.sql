-- Criar tabela de orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  budget_date TIMESTAMPTZ DEFAULT NOW(),
  gate_width DECIMAL(10,2) NOT NULL,
  gate_height DECIMAL(10,2) NOT NULL,
  gate_area DECIMAL(10,2) NOT NULL,
  gate_weight DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  profit_margin DECIMAL(5,2) NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  motor_name TEXT,
  motor_price DECIMAL(10,2),
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_client_name ON public.budgets(client_name);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON public.budgets(created_at DESC);

-- RLS Policies para segurança
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios orçamentos
CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem criar seus próprios orçamentos
CREATE POLICY "Users can create their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios orçamentos
CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Admin pode ver todos os orçamentos
CREATE POLICY "Admin can view all budgets" ON public.budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

-- Política: Admin pode atualizar todos os orçamentos
CREATE POLICY "Admin can update all budgets" ON public.budgets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin_master'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.budgets TO service_role;