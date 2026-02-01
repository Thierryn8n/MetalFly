"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Save } from "lucide-react"
import { toast } from "sonner"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"

export function SessionRecovery() {
  const { user, profile, loading, restoreSession } = useAuth()
  const { cacheUserData } = useAuthRedirect()

  useEffect(() => {
    // Tentar restaurar sessão automaticamente se não houver usuário
    if (!user && !loading) {
      console.log("Nenhum usuário encontrado, tentando restaurar sessão...")
      restoreSession()
    }
  }, [user, loading, restoreSession])

  const handleManualRestore = async () => {
    try {
      toast.info("Tentando recuperar sessão...")
      await restoreSession()
      toast.success("Sessão recuperada com sucesso!")
    } catch (error) {
      console.error("Erro ao restaurar sessão manualmente:", error)
      toast.error("Não foi possível recuperar a sessão")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Verificando sessão...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Sessão não encontrada
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRestore}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            Recuperar Sessão
          </Button>
        </div>
      </div>
    )
  }

  // Se usuário está logado, mostrar botão de salvar cache
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          if (profile) {
            cacheUserData(profile)
          }
        }}
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        Salvar Cache
      </Button>
    </div>
  )
}