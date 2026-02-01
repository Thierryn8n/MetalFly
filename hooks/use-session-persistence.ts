"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export function useSessionPersistence() {
  const { user, loading, restoreSession } = useAuth()
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    let mounted = true
    let recoveryTimeout: NodeJS.Timeout

    const attemptRecovery = async () => {
      if (!mounted || recoveryAttempted.current) return
      
      // Verificar se há indícios de sessão perdida
      if (!user && !loading && typeof window !== 'undefined') {
        const hasToken = localStorage.getItem('sb-auth-token-unique')
        const hasFallback = Object.keys(localStorage).some(key => key.startsWith('fallback_profile_'))
        
        if (hasToken || hasFallback) {
          console.log("Possível sessão perdida detectada, tentando recuperar...")
          recoveryAttempted.current = true
          
          try {
            await restoreSession()
            toast.success("Sessão recuperada automaticamente!")
          } catch (error) {
            console.error("Falha na recuperação automática:", error)
            // Não mostrar toast de erro para não incomodar o usuário
          }
        }
      }
    }

    // Tentar recuperação após um pequeno delay para permitir carregamento inicial
    recoveryTimeout = setTimeout(attemptRecovery, 1000)

    return () => {
      mounted = false
      clearTimeout(recoveryTimeout)
    }
  }, [user, loading, restoreSession])

  return { isSessionHealthy: !!user || loading }
}