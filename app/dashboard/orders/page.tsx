"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { Order } from "@/lib/types"
import { Loader2, Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, FileText } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Loading from "./loading"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 10

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  quoted: "Orcado",
  approved: "Aprovado",
  in_progress: "Em Andamento",
  completed: "Concluido",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  quoted: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export default function OrdersPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  const supabase = createBrowserClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchOrders = useCallback(async (page: number, search: string, status: string) => {
    if (!profile) return
    
    setLoading(true)
    try {
      let query = supabase
        .from("orders")
        .select("*, client:clients(*)", { count: 'exact' })
        .order("created_at", { ascending: false })

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query.range(from, to)

      if (error) throw error

      if (data) {
        setOrders(data as Order[])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Erro ao carregar orçamentos")
    } finally {
      setLoading(false)
    }
  }, [profile, supabase])

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter])

  // Fetch when page, search or filter changes
  useEffect(() => {
    fetchOrders(currentPage, debouncedSearch, statusFilter)
  }, [currentPage, debouncedSearch, statusFilter, fetchOrders])

  const handleDelete = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja excluir este orcamento?")) return

    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId)
      if (error) throw error
      toast.success("Orçamento excluído com sucesso")
      await fetchOrders(currentPage, debouncedSearch, statusFilter)
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error("Erro ao excluir orçamento")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date))
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orcamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus orcamentos e pedidos.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Orcamento
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lista de Orcamentos
              </CardTitle>
              <CardDescription>
                {totalCount} orcamento{totalCount !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center h-64">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum orcamento encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Tente filtros diferentes."
                  : "Comece criando seu primeiro orcamento."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/orders/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Orcamento
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titulo/Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Valor</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.title}</p>
                            {order.client && (
                              <p className="text-xs text-muted-foreground">
                                {order.client.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge 
                            variant="secondary"
                            className={STATUS_COLORS[order.status]}
                          >
                            {STATUS_LABELS[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-medium">
                          {formatCurrency(order.total_price)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/orders/${order.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/orders/${order.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(order.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <PaginationPrevious className="cursor-pointer" />
                        </Button>
                      </PaginationItem>
                      
                      <PaginationItem>
                         <span className="px-4 text-sm text-muted-foreground">
                           Página {currentPage} de {totalPages}
                         </span>
                      </PaginationItem>

                      <PaginationItem>
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <PaginationNext className="cursor-pointer" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
