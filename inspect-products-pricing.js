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

async function inspectProductsAndPricing() {
  try {
    console.log('🔍 Verificando tabelas de produtos e preços...');
    await client.connect();
    
    // Verificar estrutura da tabela products
    console.log('\n📋 Estrutura da tabela products:');
    const productsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    productsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar estrutura da tabela pricing_configs
    console.log('\n📋 Estrutura da tabela pricing_configs:');
    const pricingResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pricing_configs' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    pricingResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar produtos existentes
    console.log('\n📊 Produtos cadastrados:');
    const productsDataResult = await client.query(`
      SELECT id, name, category, price, is_active, created_at
      FROM public.products 
      WHERE is_active = true 
      ORDER BY name;
    `);
    
    if (productsDataResult.rows.length === 0) {
      console.log('⚠️  Nenhum produto encontrado!');
      
      // Verificar categorias de produtos
      console.log('\n📋 Verificando categorias de produtos:');
      const categoriesResult = await client.query(`
        SELECT id, name, slug, description
        FROM public.product_categories 
        ORDER BY name;
      `);
      
      categoriesResult.rows.forEach(row => {
        console.log(`  - ${row.name} (${row.slug}): ${row.description || 'Sem descrição'}`);
      });
      
      if (categoriesResult.rows.length === 0) {
        console.log('⚠️  Nenhuma categoria encontrada!');
      }
    } else {
      productsDataResult.rows.forEach(row => {
        console.log(`  - ${row.name}: R$ ${row.price} (Categoria: ${row.category || 'Sem categoria'})`);
      });
    }
    
    // Verificar configs de preços
    console.log('\n📊 Configs de preços:');
    const pricingDataResult = await client.query(`
      SELECT id, user_id, price_blade_m2, price_painting_m2, labor_cost_per_hour, profit_margin
      FROM public.pricing_configs 
      LIMIT 5;
    `);
    
    pricingDataResult.rows.forEach(row => {
      console.log(`  - Config ${row.id}:`);
      console.log(`    Lâmina m²: R$ ${row.price_blade_m2}`);
      console.log(`    Pintura m²: R$ ${row.price_painting_m2}`);
      console.log(`    Mão de obra/hora: R$ ${row.labor_cost_per_hour}`);
      console.log(`    Margem lucro: ${row.profit_margin}%`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar produtos:', error);
  } finally {
    await client.end();
    console.log('\n🏁 Verificação concluída!');
    process.exit(0);
  }
}

// Executar
inspectProductsAndPricing();