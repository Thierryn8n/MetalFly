"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { Client } from "@/lib/types"
import { Loader2, Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"


const ITEMS_PER_PAGE = 10

export default function ClientsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  
  // Pagination & Search state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  
  const supabase = createBrowserClient()
  
  // Manual debounce for search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchClients = useCallback(async (page: number, search: string) => {
    if (!profile) return
    
    setLoading(true)
    try {
      let query = supabase
        .from("clients")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: false })

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      
      const { data, count, error } = await query.range(from, to)

      if (error) throw error

      if (data) {
        setClients(data as Client[])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [profile, supabase])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  // Fetch when page or debounced search changes
  useEffect(() => {
    fetchClients(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, fetchClients])

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setAddress("")
    setNotes("")
    setEditingClient(null)
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client)
    setName(client.name)
    setEmail(client.email || "")
    setPhone(client.phone || "")
    setAddress(client.address || "")
    setNotes(client.notes || "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!profile || !name) return
    setSaving(true)

    try {
      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update({
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingClient.id)
        
        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso"
        })
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({
            user_id: profile.id,
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
            notes: notes || null,
          })

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Cliente criado com sucesso"
        })
      }

      await fetchClients(currentPage, debouncedSearch)
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving client:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return

    try {
      const { error } = await supabase.from("clients").delete().eq("id", clientId)
      if (error) throw error
      toast({
        title: "Sucesso",
        description: "Cliente removido com sucesso"
      })
      await fetchClients(currentPage, debouncedSearch)
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente",
        variant: "destructive"
      })
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e contatos.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingClient
                  ? "Atualize as informacoes do cliente."
                  : "Adicione um novo cliente ao seu cadastro."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereco</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Endereco completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotacoes sobre o cliente"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !name}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingClient ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Clientes
              </CardTitle>
              <CardDescription>
                {totalCount} cliente{totalCount !== 1 ? "s" : ""} cadastrado{totalCount !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Tente uma busca diferente."
                  : "Comece adicionando seu primeiro cliente."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            {client.address && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {client.address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.email || "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {client.phone || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(client.id)}
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
                      
                      {/* Simple pagination logic: show current page */}
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
