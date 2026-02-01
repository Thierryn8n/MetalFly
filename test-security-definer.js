const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://mzllmghqlukjwxvvgwat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bGxtZ2hxbHVrand4dnZnd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzUyNTQsImV4cCI6MjA4NDQ1MTI1NH0.fi5DMjKLsgkHkpllxDa5pzNr6Rx4u7S4pUeTbytZzUA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSecurityDefinerFunctions() {
  try {
    console.log('🧪 Testando funções SECURITY DEFINER...');
    
    // Testar a função get_user_profile_bypass
    console.log('\n1. Testando get_user_profile_bypass...');
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_user_profile_bypass', { p_user_id: '16ae8890-3b3c-4fa7-883d-13e504209e6e' })
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
    } else {
      console.log('✅ Perfil recuperado com sucesso:', profileData);
    }
    
    // Testar a função get_user_pricing_config_bypass
    console.log('\n2. Testando get_user_pricing_config_bypass...');
    const { data: pricingData, error: pricingError } = await supabase
      .rpc('get_user_pricing_config_bypass', { p_user_id: '16ae8890-3b3c-4fa7-883d-13e504209e6e' })
      .maybeSingle();
    
    if (pricingError) {
      console.error('❌ Erro ao buscar config de preços:', pricingError);
    } else {
      console.log('✅ Config de preços recuperada com sucesso:', pricingData);
    }
    
    // Testar se as funções normais ainda causam erro
    console.log('\n3. Testando função normal (deve causar erro de recursão)...');
    const { data: normalData, error: normalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '16ae8890-3b3c-4fa7-883d-13e504209e6e')
      .maybeSingle();
    
    if (normalError) {
      console.log('❌ Erro esperado na função normal:', normalError.code, '-', normalError.message);
      if (normalError.code === '42P17') {
        console.log('✅ Confirmação: Recursão infinita detectada na política normal!');
      }
    } else {
      console.log('⚠️  Função normal funcionou (inesperado):', normalData);
    }
    
    console.log('\n🏁 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

testSecurityDefinerFunctions();