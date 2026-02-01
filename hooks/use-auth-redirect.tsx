"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface CachedUserData {
  profile: any
  timestamp: number
  currentPath: string
}

export function useAuthRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Salvar página atual antes de redirecionar para login
  const saveCurrentLocation = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      localStorage.setItem('redirect_after_login', currentPath)
      console.log("📍 Página salva para redirecionamento:", currentPath)
    }
  }

  // Redirecionar para a página salva após login
  const redirectToSavedLocation = () => {
    if (typeof window !== 'undefined') {
      const savedPath = localStorage.getItem('redirect_after_login')
      if (savedPath) {
        console.log("🔄 Redirecionando para página salva:", savedPath)
        localStorage.removeItem('redirect_after_login')
        router.push(savedPath)
      } else {
        console.log("🔄 Redirecionando para dashboard (padrão)")
        router.push('/dashboard')
      }
    }
  }

  // Salvar dados do usuário no cache
  const cacheUserData = (profile: any) => {
    if (typeof window !== 'undefined' && profile) {
      const cacheData: CachedUserData = {
        profile,
        timestamp: Date.now(),
        currentPath: window.location.pathname
      }
      localStorage.setItem('cached_user_data', JSON.stringify(cacheData))
      console.log("💾 Dados do usuário salvos no cache")
      toast.success("Dados salvos no cache local")
    }
  }

  // Recuperar dados do cache
  const getCachedUserData = (): CachedUserData | null => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached_user_data')
      if (cached) {
        try {
          const data = JSON.parse(cached) as CachedUserData
          // Verificar se o cache tem menos de 24 horas
          const isValid = Date.now() - data.timestamp < 24 * 60 * 60 * 1000
          if (isValid) {
            console.log("📂 Dados recuperados do cache")
            return data
          } else {
            console.log("⏰ Cache expirado, removendo")
            localStorage.removeItem('cached_user_data')
          }
        } catch (error) {
          console.error("Erro ao recuperar cache:", error)
          localStorage.removeItem('cached_user_data')
        }
      }
    }
    return null
  }

  // Limpar todos os dados salvos
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('redirect_after_login')
      localStorage.removeItem('cached_user_data')
      console.log("🗑️ Todos os dados salvos foram limpos")
    }
  }

  // Monitorar perda de conexão/autenticação
  useEffect(() => {
    if (!loading && !user) {
      console.log("⚠️ Usuário não autenticado detectado")
      
      // Verificar se há dados em cache
      const cachedData = getCachedUserData()
      if (cachedData) {
        console.log("📂 Dados em cache disponíveis, mas usuário não autenticado")
      }
      
      // Salvar localização atual antes de redirecionar
      saveCurrentLocation()
    }
  }, [user, loading])

  return {
    saveCurrentLocation,
    redirectToSavedLocation,
    cacheUserData,
    getCachedUserData,
    clearSavedData,
    isRedirecting
  }
}