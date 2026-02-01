-- Teste de RLS - Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;

-- Teste 1: Verificar se existe política para INSERT
-- Se não houver políticas, qualquer usuário autenticado pode inserir

-- Teste 2: Verificar estrutura da tabela orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Teste 3: Verificar constraints (corrigido)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
WHERE tc.table_name = 'orders'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type;

-- Teste 4: Criar política básica de RLS se não existir (corrigido)
-- Isso permite que usuários autenticados insiram seus próprios orçamentos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Users can insert their own orders'
    ) THEN
        CREATE POLICY "Users can insert their own orders" ON public.orders
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Teste 5: Criar política para SELECT (usuários podem ver apenas seus próprios orçamentos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Users can view their own orders'
    ) THEN
        CREATE POLICY "Users can view their own orders" ON public.orders
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Teste 6: Verificar se RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'orders';

-- Se relrowsecurity for FALSE, habilitar RLS:
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;