const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase - usando valores diretos do .env.local
const supabaseUrl = "https://mzllmghqlukjwxvvgwat.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bGxtZ2hxbHVrand4dnZnd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzUyNTQsImV4cCI6MjA4NDQ1MTI1NH0.fi5DMjKLsgkHkpllxDa5pzNr6Rx4u7S4pUeTbytZzUA";

console.log('🔗 Conectando ao Supabase...');
console.log('📍 URL:', supabaseUrl.substring(0, 30) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPricingConfigs() {
  try {
    console.log('\n🔍 Verificando estrutura da tabela pricing_configs...');
    
    // Método simples: tentar fazer uma consulta
    const { data, error } = await supabase
      .from('pricing_configs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela pricing_configs:', error.message);
      console.log('\n💡 Possíveis causas:');
      console.log('   - A tabela não existe');
      console.log('   - Problemas de permissão (RLS)');
      console.log('   - Conexão com Supabase falhou');
      
      // Tentar verificar outras tabelas
      console.log('\n🔍 Tentando verificar outras tabelas...');
      const tablesToCheck = ['users', 'clients', 'motor_models'];
      
      for (const table of tablesToCheck) {
        try {
          const { data: testData, error: testError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!testError) {
            console.log(`✅ Tabela ${table} está acessível`);
          } else {
            console.log(`❌ Tabela ${table}: ${testError.message}`);
          }
        } catch (e) {
          console.log(`❌ Erro ao verificar ${table}: ${e.message}`);
        }
      }
      
    } else {
      console.log('✅ Tabela pricing_configs acessível!');
      console.log(`📊 Número de registros encontrados: ${data ? data.length : 0}`);
      
      if (data && data.length > 0) {
        console.log('\n📝 Colunas disponíveis:');
        Object.keys(data[0]).forEach(col => {
          console.log(`   - ${col}`);
        });
        
        console.log('\n📋 Exemplo de registro:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('ℹ️  Tabela existe mas está vazia');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.log('\n💡 Dicas de troubleshooting:');
    console.log('   1. Verifique as variáveis de ambiente');
    console.log('   2. Confirme que a tabela existe no Supabase');
    console.log('   3. Verifique as permissões RLS da tabela');
    console.log('   4. Teste a conexão manualmente');
  }
}

// Executar verificação
console.log('🚀 Iniciando verificação do Supabase...');
checkPricingConfigs().then(() => {
  console.log('\n✅ Verificação concluída!');
}).catch(err => {
  console.error('❌ Erro na verificação:', err);
});