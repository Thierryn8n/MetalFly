"use client"

import { useEffect, useState } from "react"
import { MetalFlyCalculator } from "@/components/calculator/metal-fly-calculator"
import { InitialConfigForm } from "@/components/calculator/initial-config-form"
import { AdvertisementDisplay } from "@/components/advertisements/advertisement-display"
import { RecursionTestPanel } from "@/components/calculator/recursion-test-panel"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { PricingConfig } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CalculatorPage() {
  const { profile } = useAuth()
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInitialConfig, setShowInitialConfig] = useState(false)
  const supabase = createBrowserClient()

  console.log("CalculatorPage - Profile:", profile)
  console.log("CalculatorPage - Supabase client created:", !!supabase)

  useEffect(() => {
    const fetchPricingConfig = async () => {
      console.log("fetchPricingConfig - Profile:", profile)
      if (!profile) {
        console.log("fetchPricingConfig - No profile, setting loading to false")
        setLoading(false)
        return
      }

      console.log("fetchPricingConfig - Starting to fetch pricing config for user:", profile.id)
      try {
        const { data, error } = await supabase
          .from("pricing_configs")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle()
        
        console.log("fetchPricingConfig - Supabase response:", { data, error })

        if (error) {
          console.error("Erro ao buscar configuração de preços:", error)
          // Se não houver configuração, mostrar formulário inicial
          if (error.code === 'PGRST116') { // No rows found
            console.log("Nenhuma configuração encontrada, mostrando formulário inicial")
            setShowInitialConfig(true)
          } else {
            setError("Erro ao carregar configurações de preço. Usando valores padrão.")
            // Use configuração padrão se não houver configuração personalizada
            const defaultConfig: PricingConfig = {
              id: "default",
              user_id: profile.id,
              blade_price_per_m2: 180,
              painting_price_per_m2: 65,
              labor_hourly_rate: 80,
              profit_margin: 25,
              additional_costs: 340,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            setPricingConfig(defaultConfig)
          }
        } else if (data) {
          setPricingConfig(data as PricingConfig)
        } else {
          // Nenhum dado retornado, mostrar formulário inicial
          console.log("Nenhuma configuração encontrada, mostrando formulário inicial")
          setShowInitialConfig(true)
        }
      } catch (error) {
        console.error("Erro ao buscar configuração de preços:", error)
        setError("Erro ao conectar ao servidor. Usando valores padrão.")
        // Use configuração padrão em caso de erro
        const defaultConfig: PricingConfig = {
          id: "default",
          user_id: profile.id,
          blade_price_per_m2: 180,
          painting_price_per_m2: 65,
          labor_hourly_rate: 80,
          profit_margin: 25,
          additional_costs: 340,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setPricingConfig(defaultConfig)
      } finally {
        setLoading(false)
      }
    }

    fetchPricingConfig()
  }, [profile])

  const handleConfigComplete = () => {
    setShowInitialConfig(false)
    setLoading(true)
    // Recarregar configuração após salvar
    const reloadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_configs")
          .select("*")
          .eq("user_id", profile?.id)
          .maybeSingle()
        
        if (data) {
          setPricingConfig(data as PricingConfig)
        }
      } catch (error) {
        console.error("Erro ao recarregar configuração:", error)
      } finally {
        setLoading(false)
      }
    }
    reloadConfig()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Por favor, faça login para acessar a calculadora.</p>
        <Button onClick={() => window.location.href = '/auth/login'}>
          Fazer Login
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calculadora de Orcamentos</h1>
          <p className="text-muted-foreground">
            Configure o portao e veja o orcamento com seus precos personalizados.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
        
        <MetalFlyCalculator />
      </div>
    )
  }

  // Mostrar formulário de configuração inicial se necessário
  if (showInitialConfig) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuração Inicial</h1>
          <p className="text-muted-foreground">
            Preencha as informações iniciais para começar a usar a calculadora.
          </p>
        </div>

        <InitialConfigForm 
          userId={profile.id} 
          onConfigComplete={handleConfigComplete} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Calculadora de Orcamentos</h1>
          <p className="text-muted-foreground">
            Configure o portao e veja o orcamento com seus precos personalizados.
          </p>
        </div>
        
        {/* Anúncios ao lado do título */}
        <div className="flex-shrink-0">
          <AdvertisementDisplay 
            position="calculator_header_right" 
            adType="both"
            className="min-w-[300px]"
          />
        </div>
      </div>

      {/* Painel de Teste de Recursão - Para validar as correções */}
      <RecursionTestPanel />

      <MetalFlyCalculator />
    </div>
  )
}
