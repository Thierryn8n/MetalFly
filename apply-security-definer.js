const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://mzllmghqlukjwxvvgwat.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bGxtZ2hxbHVrand4dnZnd2F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTI1NCwiZXhwIjoyMDg0NDUxMjU0fQ.sNoEdTH145bZ8nEX9qZL6zAC6-3_qcfE4UOydx2C0NE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
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
    console.log('🚀 Aplicando funções SECURITY DEFINER no Supabase...');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: securityDefinerFunctions
    });

    if (error) {
      console.error('❌ Erro ao aplicar funções:', error);
      
      // Tentar método alternativo - executar cada função separadamente
      console.log('🔄 Tentando método alternativo...');
      
      const functions = securityDefinerFunctions.split('\n\n--').filter(f => f.trim());
      
      for (let i = 0; i < functions.length; i++) {
        const func = functions[i];
        if (func.includes('CREATE OR REPLACE FUNCTION')) {
          console.log(`Aplicando função ${i + 1}/${functions.length}...`);
          
          const { error: funcError } = await supabase.rpc('exec_sql', {
            sql: '--' + func
          });
          
          if (funcError) {
            console.error(`Erro na função ${i + 1}:`, funcError);
          } else {
            console.log(`✅ Função ${i + 1} aplicada com sucesso!`);
          }
        }
      }
    } else {
      console.log('✅ Funções SECURITY DEFINER aplicadas com sucesso!');
    }
    
    console.log('\n📋 Verificando funções criadas...');
    
    // Listar funções criadas
    const { data: functions, error: listError } = await supabase
      .from('pg_proc')
      .select('proname, proowner::text')
      .like('proname', '%bypass%');
    
    if (!listError && functions) {
      console.log('Funções encontradas:', functions.map(f => f.proname));
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    console.log('\n🏁 Processo finalizado!');
    process.exit(0);
  }
}

// Verificar se o Supabase está configurado corretamente
console.log('🔍 Verificando configuração do Supabase...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...');

// Executar
applySecurityDefinerFunctions();