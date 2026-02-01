-- Função adicional para buscar produtos ativos com bypass de RLS
CREATE OR REPLACE FUNCTION public.get_all_active_products_bypass()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  is_active boolean,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.is_active,
    p.image_url,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE p.is_active = true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_products_bypass TO service_role;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_all_active_products_bypass IS 'Função SECURITY DEFINER para buscar produtos ativos bypassando RLS - resolve recursão infinita';