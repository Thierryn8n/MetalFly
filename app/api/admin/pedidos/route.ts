import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/admin/pedidos - Listar todos os pedidos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar permissões
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    if (!["admin", "manager_loja", "funcionario_loja"].includes(profile.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    // Buscar parâmetros de consulta
    const { searchParams } = new URL(request.url)
    const lojaId = searchParams.get("loja_id")
    const status = searchParams.get("status")
    const userId = searchParams.get("user_id")
    const search = searchParams.get("search")

    // Construir query base
    let query = supabase
      .from("pedidos")
      .select(`
        *,
        profiles!pedidos_user_id_fkey(id, full_name, email, phone),
        lojas!pedidos_loja_id_fkey(id, name, slug),
        pedido_items(
          id,
          quantidade,
          preco_unitario,
          produtos!pedido_items_produto_id_fkey(id, nome, sku)
        )
      `)
      .order("created_at", { ascending: false })

    // Aplicar filtros baseado no role do usuário
    if (profile.role === "funcionario_loja") {
      // Funcionários só veem pedidos da loja onde trabalham
      const { data: funcionarioLoja } = await supabase
        .from("loja_funcionarios")
        .select("loja_id")
        .eq("profile_id", user.id)
        .single()

      if (funcionarioLoja) {
        query = query.eq("loja_id", funcionarioLoja.loja_id)
      } else {
        return NextResponse.json({ pedidos: [] })
      }
    } else if (profile.role === "manager_loja") {
      // Managers só podem ver pedidos de suas lojas
      const { data: managerLojas } = await supabase
        .from("lojas")
        .select("id")
        .eq("manager_id", user.id)

      if (managerLojas && managerLojas.length > 0) {
        const lojaIds = managerLojas.map(loja => loja.id)
        query = query.in("loja_id", lojaIds)
      } else {
        return NextResponse.json({ pedidos: [] })
      }

      if (lojaId) {
        // Se especificou uma loja, verificar se é uma das lojas do manager
        const lojaPermitida = managerLojas.some(loja => loja.id === lojaId)
        if (lojaPermitida) {
          query = query.eq("loja_id", lojaId)
        } else {
          return NextResponse.json({ error: "Sem permissão para ver pedidos desta loja" }, { status: 403 })
        }
      }
    } else if (lojaId) {
      // Admin pode filtrar por loja
      query = query.eq("loja_id", lojaId)
    }

    // Aplicar outros filtros
    if (status) {
      query = query.eq("status", status)
    }
    if (userId) {
      query = query.eq("user_id", userId)
    }
    if (search) {
      // Buscar por nome do cliente ou ID do pedido
      query = query.or(`id.ilike.%${search}%,profiles.full_name.ilike.%${search}%`)
    }

    // Executar query
    const { data: pedidos, error } = await query

    if (error) {
      console.error("Erro ao buscar pedidos:", error)
      return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
    }

    return NextResponse.json({ pedidos: pedidos || [] })
  } catch (error) {
    console.error("Erro na API de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST /api/admin/pedidos - Criar novo pedido
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar permissões
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    if (!["admin", "manager_loja", "funcionario_loja"].includes(profile.role)) {
      return NextResponse.json({ error: "Sem permissão para criar pedidos" }, { status: 403 })
    }

    const body = await request.json()
    const {
      user_id,
      loja_id,
      items,
      forma_pagamento,
      observacoes,
      endereco_entrega,
      taxa_entrega = 0,
      desconto = 0
    } = body

    // Validações
    if (!user_id) {
      return NextResponse.json({ error: "Usuário é obrigatório" }, { status: 400 })
    }

    if (!loja_id) {
      return NextResponse.json({ error: "Loja é obrigatória" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Itens do pedido são obrigatórios" }, { status: 400 })
    }

    if (!forma_pagamento) {
      return NextResponse.json({ error: "Forma de pagamento é obrigatória" }, { status: 400 })
    }

    // Verificar se o usuário existe
    const { data: cliente, error: clienteError } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", user_id)
      .single()

    if (clienteError || !cliente) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar permissões sobre a loja
    const { data: loja, error: lojaError } = await supabase
      .from("lojas")
      .select("id, name, manager_id")
      .eq("id", loja_id)
      .single()

    if (lojaError || !loja) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 })
    }

    if (profile.role === "funcionario_loja") {
      const { data: funcionarioLoja } = await supabase
        .from("loja_funcionarios")
        .select("loja_id")
        .eq("profile_id", user.id)
        .eq("loja_id", loja_id)
        .single()

      if (!funcionarioLoja) {
        return NextResponse.json({ error: "Você só pode criar pedidos para sua loja" }, { status: 403 })
      }
    } else if (profile.role === "manager_loja" && loja.manager_id !== user.id) {
      return NextResponse.json({ error: "Você só pode criar pedidos para suas lojas" }, { status: 403 })
    }

    // Verificar produtos e calcular total
    let valor_total = 0
    const produtosVerificados = []

    for (const item of items) {
      const { produto_id, quantidade } = item

      if (!produto_id || !quantidade || quantidade <= 0) {
        return NextResponse.json({ error: "Produto e quantidade válidos são obrigatórios" }, { status: 400 })
      }

      // Verificar produto
      const { data: produto, error: produtoError } = await supabase
        .from("produtos")
        .select("id, nome, preco, preco_promocional, estoque, status")
        .eq("id", produto_id)
        .eq("loja_id", loja_id)
        .single()

      if (produtoError || !produto) {
        return NextResponse.json({ error: `Produto ${produto_id} não encontrado nesta loja` }, { status: 404 })
      }

      if (produto.status !== "active") {
        return NextResponse.json({ error: `Produto ${produto.nome} não está ativo` }, { status: 400 })
      }

      if (produto.estoque < quantidade) {
        return NextResponse.json({ error: `Estoque insuficiente para o produto ${produto.nome}` }, { status: 400 })
      }

      const preco_unitario = produto.preco_promocional || produto.preco
      valor_total += preco_unitario * quantidade

      produtosVerificados.push({
        produto_id,
        quantidade,
        preco_unitario,
        produto
      })
    }

    // Calcular total final
    const subtotal = valor_total
    const total = subtotal + taxa_entrega - desconto

    // Criar pedido em transaction
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert([{
        user_id,
        loja_id,
        forma_pagamento,
        observacoes: observacoes?.trim() || null,
        endereco_entrega: endereco_entrega || {},
        subtotal,
        taxa_entrega,
        desconto,
        valor_total: total,
        status: "pending",
        created_by: user.id
      }])
      .select(`
        *,
        profiles!pedidos_user_id_fkey(id, full_name, email, phone),
        lojas!pedidos_loja_id_fkey(id, name, slug)
      `)
      .single()

    if (pedidoError) {
      console.error("Erro ao criar pedido:", pedidoError)
      return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
    }

    // Criar itens do pedido
    const itensPedido = produtosVerificados.map(item => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario
    }))

    const { error: itensError } = await supabase
      .from("pedido_items")
      .insert(itensPedido)

    if (itensError) {
      console.error("Erro ao criar itens do pedido:", itensError)
      // Deletar pedido se falhar ao criar itens
      await supabase.from("pedidos").delete().eq("id", pedido.id)
      return NextResponse.json({ error: "Erro ao criar itens do pedido" }, { status: 500 })
    }

    // Atualizar estoque dos produtos
    for (const item of produtosVerificados) {
      const { error: estoqueError } = await supabase
        .from("produtos")
        .update({ estoque: item.produto.estoque - item.quantidade })
        .eq("id", item.produto_id)

      if (estoqueError) {
        console.error("Erro ao atualizar estoque:", estoqueError)
      }
    }

    // Buscar pedido completo com itens
    const { data: pedidoCompleto, error: finalError } = await supabase
      .from("pedidos")
      .select(`
        *,
        profiles!pedidos_user_id_fkey(id, full_name, email, phone),
        lojas!pedidos_loja_id_fkey(id, name, slug),
        pedido_items(
          id,
          quantidade,
          preco_unitario,
          produtos!pedido_items_produto_id_fkey(id, nome, sku)
        )
      `)
      .eq("id", pedido.id)
      .single()

    if (finalError) {
      console.error("Erro ao buscar pedido completo:", finalError)
      return NextResponse.json({ pedido }, { status: 201 })
    }

    return NextResponse.json({ pedido: pedidoCompleto }, { status: 201 })
  } catch (error) {
    console.error("Erro na API de criação de pedido:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}