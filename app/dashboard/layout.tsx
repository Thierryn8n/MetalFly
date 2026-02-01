"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { PanelLeftOpen } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useSessionPersistence } from "@/hooks/use-session-persistence"
import { SessionMonitor } from "@/components/auth/session-monitor"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  // Hook para monitorar e recuperar sessões perdidas
  const { isSessionHealthy } = useSessionPersistence()
  
  // Hook para gerenciar redirecionamento e cache
  const { saveCurrentLocation } = useAuthRedirect()

  console.log("DashboardContent - User:", user, "Loading:", loading, "Profile:", profile)
  console.log("DashboardContent - Session Healthy:", isSessionHealthy)

  useEffect(() => {
    console.log("DashboardContent - useEffect triggered:", { loading, user })
    if (!loading && !user) {
      console.log("DashboardContent - Redirecting to login")
      // Salvar localização atual antes de redirecionar
      saveCurrentLocation()
      router.push("/auth/login")
    }
  }, [user, loading, router, saveCurrentLocation])

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !profile) return

      try {
        // Criar cliente Supabase
        const supabase = createBrowserClient()
        
        // Verificar se o usuário já tem configuração de preços
        const { data, error } = await supabase
          .from("pricing_configs")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (error) {
          console.error("Erro ao verificar configuração:", error)
        }

        // Se não tem configuração, mostrar onboarding
        setShowOnboarding(!data)
      } catch (error) {
        console.error("Erro ao verificar onboarding:", error)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    if (user && profile) {
      checkOnboardingStatus()
    }
  }, [user, profile])

  if (loading || checkingOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (showOnboarding) {
    return (
      <OnboardingTutorial 
        userId={user.id} 
        onComplete={() => setShowOnboarding(false)} 
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Monitor de sessão para debug */}
      <SessionMonitor />
      
      {/* Menu lateral flutuante e arredondado */}
      <div className="hidden lg:block">
        <DashboardSidebar 
          floating={true} 
          rounded={true} 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <DashboardSidebar />
          </div>
        </div>
      )}

      <div className={`flex flex-1 flex-col overflow-hidden ${!sidebarCollapsed ? 'lg:ml-72' : 'lg:ml-20'}`}>
        <DashboardHeader 
          onMenuClick={() => setMobileMenuOpen(true)} 
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarOpen={!sidebarCollapsed}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Botão flutuante para abrir menu quando fechado */}
      {sidebarCollapsed && (
        <Button
          variant="default"
          size="icon"
          className="fixed left-4 top-20 z-50 rounded-full shadow-lg"
          onClick={() => setSidebarCollapsed(false)}
        >
          <PanelLeftOpen className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}
