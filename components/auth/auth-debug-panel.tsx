"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthDebugPanel() {
  const { user, profile, loading, refreshProfile, resetFetchAttempts } = useAuth()

  useEffect(() => {
    console.log("=== AUTH DEBUG PANEL ===")
    console.log("User:", user)
    console.log("Profile:", profile)
    console.log("Loading:", loading)
    console.log("========================")
  }, [user, profile, loading])

  const handleForceRefresh = async () => {
    console.log("Forçando refresh do perfil...")
    resetFetchAttempts() // Resetar contador antes de tentar
    await refreshProfile()
    console.log("Refresh forçado concluído")
  }

  const handleTestRecursion = async () => {
    console.log("Testando proteção contra recursão...")
    // Simular múltiplas chamadas simultâneas
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(refreshProfile())
    }
    await Promise.all(promises)
    console.log("Teste de recursão concluído")
  }

  if (loading) {
    return (
      <Card className="border-yellow-500">
        <CardHeader>
          <CardTitle className="text-yellow-600">Debug Auth - Carregando</CardTitle>
          <CardDescription>Aguardando autenticação...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-blue-500">
      <CardHeader>
        <CardTitle className="text-blue-600">Debug Auth Panel</CardTitle>
        <CardDescription>Informações de debug do sistema de autenticação</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="text-sm">
            <span className="font-semibold">User ID:</span> {user?.id || "Nenhum"}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Email:</span> {user?.email || "Nenhum"}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Role:</span> {profile?.role || "Nenhuma"}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Nome:</span> {profile?.full_name || "Nenhum"}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleForceRefresh} size="sm" variant="outline">
            Forçar Refresh
          </Button>
          <Button onClick={handleTestRecursion} size="sm" variant="outline">
            Testar Recursão
          </Button>
          <Button onClick={resetFetchAttempts} size="sm" variant="outline">
            Resetar Tentativas
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Console aberto para mais detalhes</p>
          <p>Use F12 para ver os logs completos</p>
        </div>
      </CardContent>
    </Card>
  )
}