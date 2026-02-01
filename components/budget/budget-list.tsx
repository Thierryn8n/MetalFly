"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, User, Phone, DollarSign, Eye, Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Budget {
  id: string
  client_name: string
  client_phone: string | null
  width: number
  height: number
  area: number
  weight: number | null
  total_price: number
  motor_model: string | null
  status: 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  additional_notes: string | null
}

export function BudgetList() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Você precisa estar logado para ver seus orçamentos")
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setBudgets(data || [])
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error)
      toast.error("Erro ao carregar orçamentos")
    } finally {
      setLoading(false)
    }
  }

  const deleteBudget = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', budgetId)

      if (error) {
        throw error
      }

      toast.success("Orçamento excluído com sucesso!")
      fetchBudgets()
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      toast.error("Erro ao excluir orçamento")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      pending: { label: 'Pendente', variant: 'secondary' },
      approved: { label: 'Aprovado', variant: 'default' },
      in_progress: { label: 'Em Andamento', variant: 'outline' },
      completed: { label: 'Concluído', variant: 'success' },
      cancelled: { label: 'Cancelado', variant: 'destructive' }
    } as const

    const statusInfo = statusMap[status as keyof typeof statusMap]
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (budgets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CardContent>
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum orçamento encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não criou nenhum orçamento. Use a calculadora para criar seu primeiro orçamento!
          </p>
          <Button onClick={() => window.location.href = '/dashboard/calculator'}>
            Ir para Calculadora
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => (
        <Card key={budget.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {budget.client_name}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(budget.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                  {budget.client_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {budget.client_phone}
                    </span>
                  )}
                </div>
              </div>
              {getStatusBadge(budget.status)}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Dimensões:</span>
                <p className="font-medium">{budget.width}m × {budget.height}m</p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Área:</span>
                <p className="font-medium">{budget.area}m²</p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Peso:</span>
                <p className="font-medium">{budget.weight}kg</p>
              </div>
            </div>

            {budget.motor_model && (
              <div className="mb-4">
                <span className="text-muted-foreground text-sm">Motor:</span>
                <p className="font-medium">{budget.motor_model}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(budget.total_price)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {/* TODO: Implementar visualização detalhada */}}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteBudget(budget.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}