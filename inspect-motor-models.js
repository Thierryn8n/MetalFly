const { Client } = require('pg');

// Configuração da conexão PostgreSQL
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

async function inspectMotorModels() {
  try {
    console.log('🔍 Verificando tabela motor_models...');
    await client.connect();
    
    // Verificar estrutura da tabela motor_models
    console.log('\n📋 Estrutura da tabela motor_models:');
    const motorResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'motor_models' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    motorResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar dados existentes
    console.log('\n📊 Dados da tabela motor_models:');
    const dataResult = await client.query(`
      SELECT id, name, weight_min_kg, weight_max_kg, price, is_active 
      FROM public.motor_models 
      WHERE is_active = true 
      ORDER BY weight_min_kg;
    `);
    
    if (dataResult.rows.length === 0) {
      console.log('⚠️  Nenhum dado encontrado na tabela motor_models!');
      
      // Inserir dados de exemplo baseados na planilha do cliente
      console.log('\n🚀 Inserindo dados de exemplo baseados na planilha...');
      
      const insertQuery = `
        INSERT INTO public.motor_models (user_id, name, weight_min_kg, weight_max_kg, price, is_active) VALUES
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 200kg', 0, 200, 1200, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 300kg', 201, 300, 1300, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 400kg', 301, 400, 1400, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 500kg', 401, 500, 1500, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 600kg', 501, 600, 1600, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 800kg', 601, 800, 2700, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 1000kg', 801, 1000, 3500, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Motor 1500kg', 1001, 1500, 6000, true),
        ('16ae8890-3b3c-4fa7-883d-13e504209e6e', 'Consultar Fábrica', 1501, 999999, 0, true);
      `;
      
      await client.query(insertQuery);
      console.log('✅ Dados de exemplo inseridos com sucesso!');
      
      // Verificar novamente
      const newDataResult = await client.query(`
        SELECT id, name, weight_min_kg, weight_max_kg, price, is_active 
        FROM public.motor_models 
        WHERE is_active = true 
        ORDER BY weight_min_kg;
      `);
      
      console.log('\n📊 Motores cadastrados:');
      newDataResult.rows.forEach(motor => {
        console.log(`  - ${motor.name} (${motor.weight_min_kg}-${motor.weight_max_kg}kg): R$ ${motor.price}`);
      });
      
    } else {
      console.log(`✅ Encontrados ${dataResult.rows.length} motores:`);
      dataResult.rows.forEach(motor => {
        console.log(`  - ${motor.name} (${motor.weight_min_kg}-${motor.weight_max_kg}kg): R$ ${motor.price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar motor_models:', error);
  } finally {
    await client.end();
    console.log('\n🏁 Verificação concluída!');
    process.exit(0);
  }
}

// Executar
inspectMotorModels();