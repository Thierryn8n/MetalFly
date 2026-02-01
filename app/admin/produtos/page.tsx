"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Função para mostrar notificações
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Carregar produtos
  const loadProdutos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/produtos")
      if (!response.ok) throw new Error("Erro ao buscar produtos")
      const data = await response.json()
      setProdutos(data.produtos || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      showNotification("Erro ao carregar produtos", "error")
    } finally {
      setLoading(false)
    }
  }

  // Carregar lojas
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
    loadProdutos()
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
        const response = await fetch(`/api/admin/produtos/${produto.id}`, {
          method: "DELETE"
        })
        if (!response.ok) throw new Error("Erro ao deletar produto")
        showNotification("Produto deletado com sucesso", "success")
        loadProdutos()
      } catch (error) {
        showNotification(error instanceof Error ? error.message : "Erro ao deletar produto", "error")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const data = {
        nome: formData.get('nome') as string,
        sku: formData.get('sku') as string,
        preco: parseFloat(formData.get('preco') as string) || 0,
        preco_promocional: formData.get('preco_promocional') ? parseFloat(formData.get('preco_promocional') as string) : null,
        estoque: parseInt(formData.get('estoque') as string) || 0,
        loja_id: formData.get('loja_id') as string,
        categoria: formData.get('categoria') as string,
        descricao: formData.get('descricao') as string,
        status: formData.get('status') as string
      }

      const method = editingProduto ? 'PUT' : 'POST'
      const url = editingProduto ? `/api/admin/produtos/${editingProduto.id}` : '/api/admin/produtos'
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao salvar produto")
      }
      
      showNotification(editingProduto ? "Produto atualizado com sucesso" : "Produto criado com sucesso", "success")
      setIsDialogOpen(false)
      loadProdutos()
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Erro ao salvar produto", "error")
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Notificação */}
      {notification && (
        <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

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

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Input 
            placeholder="Buscar produtos..." 
            className="max-w-sm"
            onChange={(e) => {
              // Implementar busca se necessário
              console.log("Buscando:", e.target.value)
            }}
          />
        </div>
        
        {loading ? (
          <div className="p-8 text-center">Carregando produtos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtos.map((produto) => (
                  <tr key={produto.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {produto.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {produto.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {produto.lojas?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      R$ {produto.preco.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={produto.estoque < 10 ? "text-red-600" : produto.estoque < 20 ? "text-yellow-600" : "text-green-600"}>
                        {produto.estoque}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        produto.status === "active" ? "bg-green-100 text-green-800" :
                        produto.status === "inactive" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {produto.status === "active" ? "Ativo" : produto.status === "inactive" ? "Inativo" : "Deletado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(produto)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(produto)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Deletar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {produtos.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhum produto encontrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <Input
                  name="nome"
                  required
                  placeholder="Nome do produto"
                  defaultValue={editingProduto?.nome || ""}
                />
              </div>
              
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <Input
                  name="sku"
                  required
                  placeholder="Código único do produto"
                  defaultValue={editingProduto?.sku || ""}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) *
                </label>
                <Input
                  name="preco"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  defaultValue={editingProduto?.preco || ""}
                />
              </div>
              
              <div>
                <label htmlFor="preco_promocional" className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Promocional (R$)
                </label>
                <Input
                  name="preco_promocional"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={editingProduto?.preco_promocional || ""}
                />
                <p className="text-xs text-gray-500 mt-1">Deixe vazio se não houver promoção</p>
              </div>
              
              <div>
                <label htmlFor="estoque" className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque *
                </label>
                <Input
                  name="estoque"
                  type="number"
                  required
                  placeholder="0"
                  defaultValue={editingProduto?.estoque || ""}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="loja_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Loja *
                </label>
                <Select name="loja_id" required defaultValue={editingProduto?.loja_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map(loja => (
                      <SelectItem key={loja.id} value={loja.id}>
                        {loja.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <Input
                  name="categoria"
                  placeholder="Categoria do produto"
                  defaultValue={editingProduto?.categoria || ""}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Textarea
                name="descricao"
                placeholder="Descrição detalhada do produto"
                rows={4}
                defaultValue={editingProduto?.descricao || ""}
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <Select name="status" required defaultValue={editingProduto?.status || "active"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}