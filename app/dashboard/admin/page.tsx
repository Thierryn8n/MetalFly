"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Users, ShoppingBag, FileText, AlertTriangle, Plus, Edit, Trash2, Eye, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface User {
  id: string
  email: string
  company_name: string
  role: string
  created_at: string
  is_active: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock_quantity: number
  is_active: boolean
  created_at: string
}

interface Order {
  id: string
  user_id: string
  total_amount: number
  status: string
  created_at: string
  user_email: string
}

interface ProductErrors {
  name?: string
  description?: string
  price?: string
  category?: string
  stock_quantity?: string
}

interface UserErrors {
  email?: string
  company_name?: string
  role?: string
}

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<string[]>([])
  
  // Estados para formulários
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [productErrors, setProductErrors] = useState<ProductErrors>({})
  const [userErrors, setUserErrors] = useState<UserErrors>({})
  
  const supabase = createBrowserClient()

  // Funções de Validação
  const validateProduct = (product: Partial<Product>): ProductErrors => {
    const errors: ProductErrors = {}
    
    if (!product.name || product.name.trim().length < 3) {
      errors.name = 'Nome do produto deve ter pelo menos 3 caracteres'
    }
    
    if (!product.description || product.description.trim().length < 10) {
      errors.description = 'Descrição deve ter pelo menos 10 caracteres'
    }
    
    if (!product.price || product.price <= 0) {
      errors.price = 'Preço deve ser maior que zero'
    } else if (product.price > 1000000) {
      errors.price = 'Preço muito alto (máximo: R$ 1.000.000,00)'
    }
    
    if (!product.category || product.category.trim().length === 0) {
      errors.category = 'Categoria é obrigatória'
    }
    
    if (product.stock_quantity === undefined || product.stock_quantity < 0) {
      errors.stock_quantity = 'Quantidade em estoque não pode ser negativa'
    } else if (product.stock_quantity > 1000000) {
      errors.stock_quantity = 'Quantidade muito alta (máximo: 1.000.000)'
    }
    
    return errors
  }

  const validateUser = (user: Partial<User>): UserErrors => {
    const errors: UserErrors = {}
    
    if (!user.email || !user.email.includes('@')) {
      errors.email = 'Email inválido'
    }
    
    if (!user.company_name || user.company_name.trim().length < 2) {
      errors.company_name = 'Nome da empresa deve ter pelo menos 2 caracteres'
    }
    
    if (!user.role || user.role.trim().length === 0) {
      errors.role = 'Função é obrigatória'
    }
    
    return errors
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Buscar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (usersError) throw usersError

      // Buscar produtos com categorias
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (productsError) throw productsError

      // Buscar pedidos com informações do usuário
      const { data: ordersData, error: ordersError } = await supabase
        .from('store_orders')
        .select(`
          *,
          user:profiles(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (ordersError) throw ordersError

      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('name')
        .order('name')

      if (categoriesError) throw categoriesError

      setUsers(usersData || [])
      setProducts(productsData?.map((p: any) => ({
        ...p,
        category: p.category?.name || 'Sem categoria'
      })) || [])
      setOrders(ordersData?.map((o: any) => ({
        ...o,
        user_email: o.user?.email || 'Email não encontrado'
      })) || [])
      setCategories(categoriesData?.map((c: any) => c.name) || [])
      
    } catch (error) {
      console.error('Erro ao buscar dados do admin:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do painel administrativo",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // CRUD para Produtos
  const handleCreateProduct = async (productData: Partial<Product>) => {
    try {
      // Validar dados do produto
      const errors = validateProduct(productData)
      if (Object.keys(errors).length > 0) {
        setProductErrors(errors)
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os erros antes de salvar",
          variant: "destructive"
        })
        return
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stock_quantity: productData.stock_quantity,
          is_active: productData.is_active ?? true
        }])
        .select()
        .single()

      if (error) throw error

      setProducts([data, ...products])
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
        variant: "default"
      })
      setShowProductDialog(false)
      setProductErrors({})
      
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar produto",
        variant: "destructive"
      })
    }
  }

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!editingProduct) return

    try {
      // Validar dados do produto
      const errors = validateProduct(productData)
      if (Object.keys(errors).length > 0) {
        setProductErrors(errors)
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os erros antes de salvar",
          variant: "destructive"
        })
        return
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stock_quantity: productData.stock_quantity,
          is_active: productData.is_active
        })
        .eq('id', editingProduct.id)
        .select()
        .single()

      if (error) throw error

      setProducts(products.map(p => p.id === data.id ? data : p))
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
        variant: "default"
      })
      setEditingProduct(null)
      setShowProductDialog(false)
      setProductErrors({})
      
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(products.filter(p => p.id !== productId))
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso!",
        variant: "default"
      })
      
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir produto",
        variant: "destructive"
      })
    }
  }

  // CRUD para Usuários
  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!editingUser) return

    try {
      // Validar dados do usuário
      const errors = validateUser(userData)
      if (Object.keys(errors).length > 0) {
        setUserErrors(errors)
        toast.error('Por favor, corrija os erros antes de salvar')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          company_name: userData.company_name,
          role: userData.role,
          is_active: userData.is_active
        })
        .eq('id', editingUser.id)
        .select()
        .single()

      if (error) throw error

      setUsers(users.map(u => u.id === data.id ? data : u))
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
        variant: "default"
      })
      setUserErrors({})
      setEditingUser(null)
      setShowUserDialog(false)
      
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao atualizar usuário')
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      setUsers(users.map(u => u.id === data.id ? data : u))
      toast({
        title: "Sucesso",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
        variant: "default"
      })
      
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  useEffect(() => {
    if (profile?.role === 'admin_master') {
      fetchAdminData()
    }
  }, [profile])

  if (!profile || profile.role !== 'admin_master') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, produtos e pedidos do sistema.
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.is_active).length} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos na Loja
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.is_active).length} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos da Loja
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de pedidos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        {/* Aba de Produtos */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Produtos</CardTitle>
                <CardDescription>
                  Adicione, edite e gerencie produtos da loja.
                </CardDescription>
              </div>
              <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? 'Edite as informações do produto.' : 'Adicione um novo produto à loja.'}
                    </DialogDescription>
                  </DialogHeader>
                  <ProductForm
                    product={editingProduct}
                    categories={categories}
                    onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    onCancel={() => {
                      setEditingProduct(null)
                      setShowProductDialog(false)
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.stock_quantity > 10 ? "outline" : product.stock_quantity > 0 ? "secondary" : "destructive"}>
                            {product.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product)
                                setShowProductDialog(true)
                                setProductErrors({})
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie usuários do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa/Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {user.company_name || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{user.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4 opacity-50" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user)
                                setShowUserDialog(true)
                                setUserErrors({})
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Pedidos */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos da Loja</CardTitle>
              <CardDescription>
                Últimos pedidos realizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: Order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{order.user_email}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'pending' ? 'secondary' :
                              order.status === 'cancelled' ? 'destructive' : 'outline'
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de edição de usuário */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setEditingUser(null)
                setShowUserDialog(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente de formulário de produto
function ProductForm({ product, categories, onSubmit, onCancel }: {
  product: Product | null
  categories: string[]
  onSubmit: (data: Partial<Product>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || '',
    stock_quantity: product?.stock_quantity || 0,
    is_active: product?.is_active ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (field: string, value: string | number): string | undefined => {
    switch (field) {
      case 'name':
        if (!value || typeof value !== 'string' || value.trim().length === 0) return 'O nome do produto é obrigatório'
        if (value.length < 3) return 'O nome deve ter pelo menos 3 caracteres'
        if (value.length > 100) return 'O nome não pode ter mais de 100 caracteres'
        break
      case 'price':
        if (typeof value !== 'number') return 'O preço deve ser um número'
        if (value < 0) return 'O preço não pode ser negativo'
        if (value > 100000) return 'O preço não pode ser maior que R$ 100.000'
        if (value === 0) return 'O preço deve ser maior que zero'
        break
      case 'stock_quantity':
        if (typeof value !== 'number') return 'A quantidade deve ser um número'
        if (value < 0) return 'O estoque não pode ser negativo'
        if (value > 10000) return 'O estoque não pode ser maior que 10.000'
        break
      case 'category':
        if (!value || typeof value !== 'string') return 'A categoria é obrigatória'
        break
    }
    return undefined
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error || '' }))
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field as keyof typeof formData])
    setErrors(prev => ({ ...prev, [field]: error || '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData])
      if (error) newErrors[field] = error
    })
    
    setErrors(newErrors)
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            required
            className={errors.name && touched.name ? "border-red-500" : ""}
          />
          {errors.name && touched.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange('price', parseFloat(e.target.value))}
              onBlur={() => handleBlur('price')}
              required
              className={errors.price && touched.price ? "border-red-500" : ""}
            />
            {errors.price && touched.price && (
              <p className="text-sm text-red-500">{errors.price}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Estoque</Label>
            <Input
              id="stock_quantity"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value))}
              onBlur={() => handleBlur('stock_quantity')}
              required
              className={errors.stock_quantity && touched.stock_quantity ? "border-red-500" : ""}
            />
            {errors.stock_quantity && touched.stock_quantity && (
              <p className="text-sm text-red-500">{errors.stock_quantity}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger id="category" className={errors.category && touched.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && touched.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="is_active">Status</Label>
            <Select value={formData.is_active.toString()} onValueChange={(value) => handleChange('is_active', value === 'true')}>
              <SelectTrigger id="is_active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {product ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Componente de formulário de usuário
function UserForm({ user, onSubmit, onCancel }: {
  user: User
  onSubmit: (data: Partial<User>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    company_name: user.company_name || '',
    role: user.role || 'user',
    is_active: user.is_active ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (field: string, value: string | boolean): string | undefined => {
    switch (field) {
      case 'company_name':
        if (typeof value === 'string' && value.length > 100) return 'O nome da empresa não pode ter mais de 100 caracteres'
        break
      case 'role':
        if (typeof value !== 'string' || !value) return 'A função é obrigatória'
        if (!['user', 'admin', 'admin_master'].includes(value)) return 'Função inválida'
        break
    }
    return undefined
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error || '' }))
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field as keyof typeof formData])
    setErrors(prev => ({ ...prev, [field]: error || '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData])
      if (error) newErrors[field] = error
    })
    
    setErrors(newErrors)
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Nome da Empresa</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => handleChange('company_name', e.target.value)}
          onBlur={() => handleBlur('company_name')}
          className={errors.company_name && touched.company_name ? "border-red-500" : ""}
        />
        {errors.company_name && touched.company_name && (
          <p className="text-sm text-red-500">{errors.company_name}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Função</Label>
        <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
          <SelectTrigger id="role" className={errors.role && touched.role ? "border-red-500" : ""}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="admin_master">Administrador Master</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && touched.role && (
          <p className="text-sm text-red-500">{errors.role}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="is_active">Status</Label>
        <Select value={formData.is_active.toString()} onValueChange={(value) => handleChange('is_active', value === 'true')}>
          <SelectTrigger id="is_active">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ativo</SelectItem>
            <SelectItem value="false">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </DialogFooter>
    </form>
  )
}