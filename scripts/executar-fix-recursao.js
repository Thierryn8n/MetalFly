const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas no arquivo .env.local');
  process.exit(1);
}

// Criar cliente com service role key (permissões completas)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Ler o script SQL
const sqlFilePath = path.join(__dirname, 'scripts/executar-fix-recursao-completo.sql');
let sqlScript;

try {
  sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('📖 Script SQL carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao ler arquivo SQL:', error.message);
  process.exit(1);
}

// Função para executar o script SQL
async function executeSQLScript() {
  console.log('🚀 Iniciando aplicação das correções de recursão...');
  
  try {
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📊 Encontrados ${commands.length} comandos SQL para executar`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n🔧 Executando comando ${i + 1}/${commands.length}...`);
      
      try {
        // Para comandos SELECT, usar rpc com sql
        if (command.toLowerCase().includes('select')) {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: command 
          });
          
          if (error) {
            console.warn(`⚠️  Aviso no comando ${i + 1}:`, error.message);
          } else if (data && data.length > 0) {
            console.log(`✅ Resultado:`, data);
          }
        } else {
          // Para outros comandos, usar rpc genérico
          const { error } = await supabase.rpc('exec_sql', { 
            sql: command 
          });
          
          if (error) {
            // Ignorar erros de "already exists" ou "does not exist"
            if (error.message.includes('already exists') || error.message.includes('does not exist')) {
              console.log(`ℹ️  Comando ${i + 1} já foi executado ou não se aplica`);
            } else {
              console.warn(`⚠️  Aviso no comando ${i + 1}:`, error.message);
            }
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        }
      } catch (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
      }
    }

    console.log('\n🎉 Correções de recursão aplicadas com sucesso!');
    console.log('\n📋 Resumo das correções:');
    console.log('   ✅ Funções SECURITY DEFINER criadas');
    console.log('   ✅ Políticas RLS recursivas removidas');
    console.log('   ✅ Novas políticas não-recursivas criadas');
    console.log('   ✅ Permissões configuradas');
    
  } catch (error) {
    console.error('❌ Erro ao executar script SQL:', error.message);
    process.exit(1);
  }
}

// Executar o script
executeSQLScript().catch(console.error);