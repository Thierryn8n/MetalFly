const { Client } = require('pg');

// Configuração da conexão PostgreSQL com Pooler
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mzllmghqlukjwxvvgwat',
  password: 'nfJn4KG6RfFVpDzt',
  ssl: {
    rejectUnauthorized: false
  }
});

// SQL das funções SECURITY DEFINER
const securityDefinerFunctions = `
-- Criar função para buscar perfil com bypass de RLS
CREATE OR REPLACE FUNCTION public.get_user_profile_bypass(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  company text,
  phone text,
  avatar_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função executa com privilégios do proprietário (supabase_admin)
  -- permitindo acessar dados sem ser restrita pelas políticas RLS
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    p.company,
    p.phone,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- Criar função para buscar configuração de preços com bypass de RLS
CREATE OR REPLACE FUNCTION public.get_user_pricing_config_bypass(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  material_margin numeric,
  labor_hourly_rate numeric,
  profit_margin numeric,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.user_id,
    pc.material_margin,
    pc.labor_hourly_rate,
    pc.profit_margin,
    pc.created_at,
    pc.updated_at
  FROM public.pricing_configs pc
  WHERE pc.user_id = p_user_id;
END;
$$;

-- Criar função para criar/atualizar perfil com bypass de RLS
CREATE OR REPLACE FUNCTION public.upsert_user_profile_bypass(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_role text DEFAULT 'user',
  p_company text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    company,
    phone,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_role,
    p_company,
    p_phone,
    p_avatar_url,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    company = EXCLUDED.company,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW()
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$;

-- Criar função para criar/atualizar configuração de preços com bypass de RLS
CREATE OR REPLACE FUNCTION public.upsert_user_pricing_config_bypass(
  p_user_id uuid,
  p_material_margin numeric DEFAULT 30,
  p_labor_hourly_rate numeric DEFAULT 80,
  p_profit_margin numeric DEFAULT 25
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config_id uuid;
BEGIN
  INSERT INTO public.pricing_configs (
    user_id,
    material_margin,
    labor_hourly_rate,
    profit_margin,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_material_margin,
    p_labor_hourly_rate,
    p_profit_margin,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    material_margin = EXCLUDED.material_margin,
    labor_hourly_rate = EXCLUDED.labor_hourly_rate,
    profit_margin = EXCLUDED.profit_margin,
    updated_at = NOW()
  RETURNING id INTO v_config_id;
  
  RETURN v_config_id;
END;
$$;

-- Adicionar comentários explicativos
COMMENT ON FUNCTION public.get_user_profile_bypass IS 'Função SECURITY DEFINER para buscar perfil bypassando RLS - resolve recursão infinita';
COMMENT ON FUNCTION public.get_user_pricing_config_bypass IS 'Função SECURITY DEFINER para buscar config de preços bypassando RLS - resolve recursão infinita';
COMMENT ON FUNCTION public.upsert_user_profile_bypass IS 'Função SECURITY DEFINER para criar/atualizar perfil bypassando RLS - resolve recursão infinita';
COMMENT ON FUNCTION public.upsert_user_pricing_config_bypass IS 'Função SECURITY DEFINER para criar/atualizar config de preços bypassando RLS - resolve recursão infinita';
`;

async function applySecurityDefinerFunctions() {
  try {
    console.log('🔗 Conectando ao PostgreSQL do Supabase...');
    await client.connect();
    
    console.log('🚀 Aplicando funções SECURITY DEFINER...');
    
    // Executar o SQL
    await client.query(securityDefinerFunctions);
    
    console.log('✅ Funções SECURITY DEFINER aplicadas com sucesso!');
    
    console.log('\n📋 Verificando funções criadas...');
    
    // Listar funções criadas
    const result = await client.query(`
      SELECT proname, pg_get_function_identity_arguments(oid) as args
      FROM pg_proc 
      WHERE proname LIKE '%bypass%'
      ORDER BY proname;
    `);
    
    console.log('Funções encontradas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.proname}(${row.args})`);
    });
    
    console.log('\n🔍 Verificando permissões...');
    
    // Verificar se as funções são SECURITY DEFINER
    const securityCheck = await client.query(`
      SELECT proname, prosecdef
      FROM pg_proc 
      WHERE proname LIKE '%bypass%';
    `);
    
    securityCheck.rows.forEach(row => {
      console.log(`  - ${row.proname}: ${row.prosecdef ? 'SECURITY DEFINER ✅' : 'SECURITY DEFINER ❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao aplicar funções:', error);
  } finally {
    await client.end();
    console.log('\n🏁 Processo finalizado!');
    process.exit(0);
  }
}

// Executar
applySecurityDefinerFunctions();