"use client"

import { useState, useEffect } from "react"
import { useCRUD, useNotification } from "@/app/admin/components/hooks"
import { DataTable } from "@/app/admin/components/tables/data-table"
import { Button } from "@/app/admin/components/forms/button"
import { Form } from "@/app/admin/components/forms/form"
import { Input } from "@/app/admin/components/forms/input"
import { Select } from "@/app/admin/components/forms/select"
import { Textarea } from "@/app/admin/components/forms/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/admin/components/modals/dialog"

interface Produto {
  id: string
  nome: string
  sku: string
  descricao: string | null
  preco: number
  preco_promocional: number | null
  estoque: number
  status: "active" | "inactive" | "deleted"
  categoria: string | null
  imagens: string[] | null
  loja_id: string
  created_at: string
  updated_at: string
  lojas?: {
    id: string
    name: string
    slug: string
  }
}

interface Loja {
  id: string
  name: string
  slug: string
}

export default function ProdutosPage() {
  const { showNotification } = useNotification()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [lojas, setLojas] = useState<Loja[]>([])

  const {
    data: produtos,
    loading,
    refetch,
    create,
    update,
    delete: deleteProduto
  } = useCRUD<Produto>({
    fetchAll: async () => {
      const response = await fetch("/api/admin/produtos")
      if (!response.ok) throw new Error("Erro ao buscar produtos")
      const data = await response.json()
      return data.produtos || []
    },
    create: async (data: Partial<Produto>) => {
      const response = await fetch("/api/admin/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar produto")
      }
      const result = await response.json()
      return result.produto
    },
    update: async (id: string, data: Partial<Produto>) => {
      const response = await fetch(`/api/admin/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar produto")
      }
      const result = await response.json()
      return result.produto
    },
    delete: async (id: string) => {
      const response = await fetch(`/api/admin/produtos/${id}`, {
        method: "DELETE"
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao deletar produto")
      }
    }
  })

  const loadLojas = async () => {
    try {
      const response = await fetch("/api/admin/lojas")
      if (response.ok) {
        const data = await response.json()
        setLojas(data.lojas || [])
      }
    } catch (error) {
      console.error("Erro ao buscar lojas:", error)
    }
  }

  useEffect(() => {
    loadLojas()
  }, [])

  const handleCreate = () => {
    setEditingProduto(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto)
    setIsDialogOpen(true)
  }

  const handleDelete = async (produto: Produto) => {
    if (confirm(`Tem certeza que deseja deletar o produto "${produto.nome}"?`)) {
      try {
        await deleteProduto(produto.id)
        showNotification("Produto deletado com sucesso", "success")
        refetch()
      } catch (error) {
        showNotification(error instanceof Error ? error.message : "Erro ao deletar produto", "error")
      }
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      // Converter valores numéricos
      const processedData = {
        ...data,
        preco: parseFloat(data.preco) || 0,
        preco_promocional: data.preco_promocional ? parseFloat(data.preco_promocional) : null,
        estoque: parseInt(data.estoque) || 0
      }

      if (editingProduto) {
        await update(editingProduto.id, processedData)
        showNotification("Produto atualizado com sucesso", "success")
      } else {
        await create(processedData)
        showNotification("Produto criado com sucesso", "success")
      }
      setIsDialogOpen(false)
      refetch()
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Erro ao salvar produto", "error")
    }
  }

  const columns = [
    {
      key: "nome",
      label: "Nome",
      sortable: true
    },
    {
      key: "sku",
      label: "SKU",
      sortable: true
    },
    {
      key: "lojas.name",
      label: "Loja",
      render: (value: any, item: Produto) => item.lojas?.name || "-"
    },
    {
      key: "preco",
      label: "Preço",
      sortable: true,
      render: (value: number) => `R$ ${value.toFixed(2)}`
    },
    {
      key: "estoque",
      label: "Estoque",
      sortable: true,
      render: (value: number) => (
        <span className={value < 10 ? "text-red-600" : value < 20 ? "text-yellow-600" : "text-green-600"}>
          {value}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
          value === "active" ? "bg-green-100 text-green-800" :
          value === "inactive" ? "bg-yellow-100 text-yellow-800" :
          "bg-red-100 text-red-800"
        }`}>
          {value === "active" ? "Ativo" : value === "inactive" ? "Inativo" : "Deletado"}
        </span>
      )
    },
    {
      key: "created_at",
      label: "Criado em",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString("pt-BR")
    },
    {
      key: "actions",
      label: "Ações",
      render: (value: any, item: Produto) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(item)}
            className="text-red-600 hover:text-red-700"
          >
            Deletar
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os produtos do sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          Novo Produto
        </Button>
      </div>

      <DataTable
        data={produtos}
        columns={columns}
        loading={loading}
        searchPlaceholder="Buscar produtos..."
        onRefresh={refetch}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          
          <Form
            onSubmit={handleSubmit}
            initialData={editingProduto || {}}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="nome"
                label="Nome do Produto"
                required
                placeholder="Nome do produto"
              />
              
              <Input
                name="sku"
                label="SKU"
                required
                placeholder="Código único do produto"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Input
                name="preco"
                label="Preço (R$)"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
              />
              
              <Input
                name="preco_promocional"
                label="Preço Promocional (R$)"
                type="number"
                step="0.01"
                placeholder="0.00"
                helpText="Deixe vazio se não houver promoção"
              />
              
              <Input
                name="estoque"
                label="Estoque"
                type="number"
                required
                placeholder="0"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                name="loja_id"
                label="Loja"
                required
              >
                <option value="">Selecione uma loja</option>
                {lojas.map(loja => (
                  <option key={loja.id} value={loja.id}>
                    {loja.name}
                  </option>
                ))}
              </Select>
              
              <Input
                name="categoria"
                label="Categoria"
                placeholder="Categoria do produto"
              />
            </div>
            
            <Textarea
              name="descricao"
              label="Descrição"
              placeholder="Descrição detalhada do produto"
              rows={4}
            />
            
            <Select
              name="status"
              label="Status"
              required
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </Select>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingProduto ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}