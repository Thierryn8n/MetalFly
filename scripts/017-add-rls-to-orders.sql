-- Adicionar RLS (Row Level Security) à tabela orders existente

-- Habilitar RLS na tabela orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios orçamentos
CREATE POLICY "Users can view only their own orders" ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para permitir que usuários criem seus próprios orçamentos
CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas seus próprios orçamentos
CREATE POLICY "Users can update only their own orders" ON public.orders
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam apenas seus próprios orçamentos
CREATE POLICY "Users can delete only their own orders" ON public.orders
    FOR DELETE
    USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders USING btree (created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE public.orders IS 'Tabela de orçamentos e pedidos de portões metálicos';
COMMENT ON COLUMN public.orders.client_name IS 'Nome do cliente';
COMMENT ON COLUMN public.orders.client_phone IS 'Telefone do cliente';
COMMENT ON COLUMN public.orders.width IS 'Largura do portão em metros';
COMMENT ON COLUMN public.orders.height IS 'Altura do portão em metros';
COMMENT ON COLUMN public.orders.area IS 'Área total do portão em m²';
COMMENT ON COLUMN public.orders.weight IS 'Peso estimado do portão em kg';
COMMENT ON COLUMN public.orders.total_price IS 'Preço total do orçamento';
COMMENT ON COLUMN public.orders.status IS 'Status do orçamento: draft, pending, approved, in_progress, completed, cancelled';