"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { Button } from "@/components/ui/button"
import { Save, Download, Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function UserDataCache() {
  const { profile } = useAuth()
  const { cacheUserData, getCachedUserData, clearSavedData } = useAuthRedirect()
  const [isCaching, setIsCaching] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<{
    hasCache: boolean
    timestamp?: number
  }>(() => {
    const cached = getCachedUserData()
    return {
      hasCache: !!cached,
      timestamp: cached?.timestamp
    }
  })

  const handleSaveCache = async () => {
    if (!profile) {
      toast.error("Nenhum perfil para salvar")
      return
    }

    setIsCaching(true)
    try {
      cacheUserData(profile)
      setCacheStatus({
        hasCache: true,
        timestamp: Date.now()
      })
      toast.success("Dados salvos no cache com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar cache:", error)
      toast.error("Erro ao salvar dados no cache")
    } finally {
      setIsCaching(false)
    }
  }

  const handleClearCache = () => {
    clearSavedData()
    setCacheStatus({ hasCache: false })
    toast.success("Cache limpo com sucesso")
  }

  const handleRefreshStatus = () => {
    const cached = getCachedUserData()
    setCacheStatus({
      hasCache: !!cached,
      timestamp: cached?.timestamp
    })
    toast.info("Status do cache atualizado")
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Cache de Dados</h4>
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleRefreshStatus}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atualizar status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          Status: {cacheStatus.hasCache ? (
            <span className="text-green-600 font-medium">✓ Dados em cache</span>
          ) : (
            <span className="text-orange-600 font-medium">✗ Sem cache</span>
          )}
        </div>
        
        {cacheStatus.timestamp && (
          <div className="text-xs text-muted-foreground">
            Último backup: {formatDate(cacheStatus.timestamp)}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleSaveCache}
          disabled={!profile || isCaching}
        >
          {isCaching ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </>
          )}
        </Button>

        {cacheStatus.hasCache && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleClearCache}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpar cache</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {!profile && (
        <div className="text-xs text-muted-foreground text-center">
          Faça login para salvar seus dados
        </div>
      )}
    </div>
  )
}