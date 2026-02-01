// Script de teste com autenticação real para verificar RLS
const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://mzllmghqlukjwxvvgwat.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bGxtZ2hxbHVrand4dnZnd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzUyNTQsImV4cCI6MjA4NDQ1MTI1NH0.fi5DMjKLsgkHkpllxDa5pzNr6Rx4u7S4pUeTbytZzUA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsertWithAuth() {
  console.log('🧪 Testando inserção com autenticação real...')
  
  try {
    // Primeiro, vamos verificar se há algum usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Nenhum usuário autenticado encontrado')
      console.log('🔐 Tentando fazer login com credenciais de teste...')
      
      // Tentar fazer login (você pode precisar criar um usuário de teste)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'teste@example.com',
        password: 'teste123'
      })
      
      if (loginError) {
        console.error('❌ Erro ao fazer login:', loginError.message)
        console.log('💡 Sugestão: Crie um usuário de teste ou use um usuário existente')
        return
      }
      
      console.log('✅ Login realizado com sucesso!')
      console.log('Usuário:', loginData.user.email)
      console.log('ID:', loginData.user.id)
    } else {
      console.log('✅ Usuário já autenticado:', user.email)
      console.log('ID:', user.id)
    }
    
    // Obter o usuário atual
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      console.error('❌ Não foi possível obter o usuário autenticado')
      return
    }
    
    console.log('📊 Preparando dados do orçamento...')
    
    // Dados de teste usando o ID do usuário autenticado
    const testData = {
      user_id: currentUser.id, // Usar o ID do usuário autenticado
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
      additional_notes: 'Teste de inserção com RLS e autenticação',
      total_price: 2750.00,
      status: 'draft'
    }
    
    console.log('📋 Dados do orçamento:', JSON.stringify(testData, null, 2))
    
    console.log('📝 Inserindo orçamento...')
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
      
      // Tratamento específico para erros comuns
      if (error.code === '42501') {
        console.error('🚫 RLS: Permissão negada.')
        console.error('💡 Verifique se:')
        console.error('   1. O usuário está autenticado')
        console.error('   2. As políticas RLS estão configuradas corretamente')
        console.error('   3. O user_id no banco corresponde ao auth.uid()')
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
testInsertWithAuth()