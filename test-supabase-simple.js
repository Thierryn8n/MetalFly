// Script de teste simples para verificar inserção no Supabase
const { createClient } = require('@supabase/supabase-js')

// Configuração direta do Supabase (evitando problemas com dotenv)
const supabaseUrl = 'https://mzllmghqlukjwxvvgwat.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bGxtZ2hxbHVrand4dnZnd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzUyNTQsImV4cCI6MjA4NDQ1MTI1NH0.fi5DMjKLsgkHkpllxDa5pzNr6Rx4u7S4pUeTbytZzUA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
  console.log('🧪 Iniciando teste de inserção no Supabase...')
  
  try {
    // Testar conexão primeiro
    console.log('📡 Testando conexão com Supabase...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError)
      return
    }
    
    console.log('✅ Conexão estabelecida com sucesso')
    
    // Dados de teste (simulando um orçamento)
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // ID de teste
      client_name: 'Cliente Teste RLS',
      client_phone: '(11) 99999-9999',
      width: 3.0,
      height: 3.0,
      area: 9.0,
      weight: 117.0,
      blade_price_applied: 1200.00,
      painting_price_total: 450.00,
      motor_cost: 850.00,
      motor_model: 'Motor PPA 1/4 HP',
      additional_cost: 450.00,
      additional_notes: 'Teste de inserção com RLS',
      total_price: 2750.00,
      status: 'draft'
    }
    
    console.log('📊 Dados do teste:', JSON.stringify(testData, null, 2))
    
    console.log('📝 Inserindo dados...')
    const { data, error } = await supabase
      .from('orders')
      .insert([testData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ ERRO AO INSERIR:')
      console.error('Código:', error.code)
      console.error('Mensagem:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
      
      // Tratamento específico para erros comuns
      if (error.code === '42501') {
        console.error('🚫 RLS: Permissão negada. Verifique as políticas RLS.')
      } else if (error.code === '23505') {
        console.error('🔄 Registro duplicado')
      } else if (error.code === '23503') {
        console.error('🔗 Erro de chave estrangeira')
      } else if (error.code === '23502') {
        console.error('📋 Campo obrigatório não preenchido')
      }
    } else {
      console.log('✅ Inserção bem-sucedida!')
      console.log('Dados retornados:', data)
      
      // Verificar se realmente foi inserido
      console.log('🔍 Verificando inserção...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', data.id)
        .single()
      
      if (verifyError) {
        console.error('❌ Erro ao verificar inserção:', verifyError)
      } else {
        console.log('✅ Verificação bem-sucedida! Registro encontrado:', verifyData)
      }
    }
    
  } catch (error) {
    console.error('❌ ERRO CAPTURADO:', error)
  }
}

// Executar o teste
testInsert()