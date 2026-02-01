"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { 
  Calculator, 
  Users, 
  FileText, 
  TrendingUp,
  ShoppingBag,
  GraduationCap,
  ArrowRight,
  Plus
} from "lucide-react"
import Link from "next/link"
import { UserDataCache } from "@/components/dashboard/user-data-cache"

interface DashboardStats {
  totalClients: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  })
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return

      const [clientsRes, ordersRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact" }),
        supabase.from("orders").select("id, status", { count: "exact" }),
      ])

      const orders = ordersRes.data || []
      const pendingOrders = orders.filter(o => 
        ["draft", "quoted", "approved", "in_progress"].includes(o.status)
      ).length
      const completedOrders = orders.filter(o => o.status === "completed").length

      setStats({
        totalClients: clientsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingOrders,
        completedOrders,
      })
    }

    fetchStats()
  }, [profile])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ola, {profile?.full_name?.split(" ")[0] || "Usuario"}!
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de controle.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/calculator">
              <Plus className="mr-2 h-4 w-4" />
              Novo Orcamento
            </Link>
          </Button>
        </div>
      </div>

      {/* Cache de dados do usuário */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-1">
          <UserDataCache />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orcamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orcamentos criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orcamentos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluidos</CardTitle>
            <Badge variant="secondary">{stats.completedOrders}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.completedOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Servicos finalizados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Calculadora</CardTitle>
                <CardDescription>Crie orcamentos rapidamente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/calculator">
                Abrir Calculadora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-accent/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <ShoppingBag className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">Loja</CardTitle>
                <CardDescription>Compre insumos com desconto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/store">
                Ver Produtos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Academy</CardTitle>
                <CardDescription>Aprenda novas tecnicas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/academy">
                Ver Cursos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
