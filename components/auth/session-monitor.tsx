"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export function SessionMonitor() {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Monitorar mudanças de sessão e notificar
    if (!loading) {
      if (user) {
        console.log("✅ Usuário autenticado:", user.id)
      } else {
        console.log("❌ Usuário não autenticado")
        
        // Verificar se há tokens no localStorage que indicam sessão perdida
        if (typeof window !== 'undefined') {
          const hasAuthToken = localStorage.getItem('sb-auth-token-unique')
          const hasFallbackProfile = Object.keys(localStorage).some(key => key.startsWith('fallback_profile_'))
          
          if (hasAuthToken || hasFallbackProfile) {
            console.warn("⚠️ Possível sessão perdida detectada!")
            console.log("- Token existe:", !!hasAuthToken)
            console.log("- Fallback profile existe:", hasFallbackProfile)
            
            // Não notificar imediatamente para não incomodar o usuário
            // mas registrar para debug
          }
        }
      }
    }
  }, [user, loading])

  return null
}