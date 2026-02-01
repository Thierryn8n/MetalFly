"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Calculator, Ruler, Cog, DollarSign, Lock, Loader2, FileText, ArrowRight } from "lucide-react"
import type { GateCalculation, CalculationResult, PricingConfig } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

// Preços genéricos para a calculadora pública
const PUBLIC_PRICES = {
  material: {
    iron: 350,
    aluminum: 550,
    stainless: 850,
  },
  gateType: {
    sliding: 1.0,
    swing: 0.85,
    sectional: 1.3,
    rolling: 1.15,
  },
  automation: {
    none: 0,
    basic: 1200,
    premium: 2800,
  },
}

const GATE_TYPE_LABELS: Record<string, string> = {
  sliding: "Deslizante",
  swing: "Basculante",
  sectional: "Seccional",
  rolling: "Enrolar",
}

const MATERIAL_LABELS: Record<string, string> = {
  iron: "Ferro/Aco",
  aluminum: "Aluminio",
  stainless: "Inox",
}

const AUTOMATION_LABELS: Record<string, string> = {
  none: "Sem Automacao",
  basic: "Basica",
  premium: "Premium",
}

interface GateCalculatorProps {
  pricingConfig?: PricingConfig | null
  showPricing?: boolean
  isPublic?: boolean
}

export function GateCalculator({ pricingConfig, showPricing = true, isPublic = false }: GateCalculatorProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showResult, setShowResult] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const [calculation, setCalculation] = useState<GateCalculation>({
    gateType: "sliding",
    width: 3,
    height: 2,
    automationType: "basic",
    materialType: "iron",
  })

  // Recuperar dados do localStorage se estiver na página pública e voltar do login
  useEffect(() => {
    if (isPublic && typeof window !== "undefined") {
      try {
        const savedCalculation = localStorage.getItem("pendingCalculation")
        if (savedCalculation) {
          const parsed = JSON.parse(savedCalculation)
          setCalculation(parsed)
          // Se o usuário já estiver logado, redireciona para o dashboard com os dados
          if (user) {
            router.push("/dashboard/orders/new?from_public=true")
          }
        }
      } catch (e) {
        console.error("Erro ao recuperar cálculo salvo", e)
      }
    }
  }, [isPublic, user, router])

  const config = pricingConfig || {
    material_margin: 30,
    labor_hourly_rate: 80,
    profit_margin: 25,
  }

  const result = useMemo((): CalculationResult => {
    const area = calculation.width * calculation.height
    // Usar preços genéricos se for público, ou baseados na config se for logado (aqui simplificado, pois a lógica real avançada será no dashboard)
    const basePrice = PUBLIC_PRICES.material[calculation.materialType]
    const typeMultiplier = PUBLIC_PRICES.gateType[calculation.gateType]
    
    const materialCost = area * basePrice * typeMultiplier * (1 + config.material_margin / 100)
    const laborHours = area * 2 + 4 
    const laborCost = laborHours * config.labor_hourly_rate
    const automationCost = PUBLIC_PRICES.automation[calculation.automationType]
    
    const subtotal = materialCost + laborCost + automationCost
    const profitMargin = subtotal * (config.profit_margin / 100)
    const totalPrice = subtotal + profitMargin

    return {
      materialCost,
      laborCost,
      automationCost,
      subtotal,
      profitMargin,
      totalPrice,
    }
  }, [calculation, config])

  const handleCalculate = () => {
    if (isPublic) {
      // Salva no localStorage para persistência
      if (typeof window !== "undefined") {
        localStorage.setItem("pendingCalculation", JSON.stringify(calculation))
      }
      
      if (!user) {
        // Redireciona para login/registro se não estiver logado
        router.push("/auth/signup?redirect=/dashboard/orders/new")
      } else {
        // Se já estiver logado (improvável nesta tela, mas possível), vai para o dashboard
        router.push("/dashboard/orders/new?from_public=true")
      }
    } else {
      // Lógica interna do dashboard (apenas mostra resultado ou salva)
      setShowResult(true)
    }
  }

  const handleCreateOrder = async () => {
    try {
      // Criar objeto com os dados do orçamento
      const orderData = {
        user_id: user?.id,
        gate_type: calculation.gateType,
        width: calculation.width,
        height: calculation.height,
        material: calculation.materialType,
        automation_type: calculation.automationType,
        material_cost: result.materialCost,
        labor_cost: result.laborCost,
        automation_cost: result.automationCost,
        total_price: result.totalPrice,
        status: 'draft',
        created_at: new Date().toISOString(),
      }

      // Redirecionar para a página de criação de ordem com os dados
      router.push(`/dashboard/orders/new?data=${encodeURIComponent(JSON.stringify(orderData))}`)
    } catch (error) {
      console.error("Erro ao criar ordem:", error)
      alert("Erro ao criar ordem. Por favor, tente novamente.")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Não renderizar até estar no cliente (evita erros de hidratação)
  if (!isClient) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-primary" />
              Configuracao do Portao
            </CardTitle>
            <CardDescription>
              Carregando calculadora...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog className="h-5 w-5 text-primary" />
            Configuracao do Portao
          </CardTitle>
          <CardDescription>
            Defina as caracteristicas para o calculo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Tipo de Portao</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GATE_TYPE_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  variant={calculation.gateType === key ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setCalculation({ ...calculation, gateType: key as any })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Material</Label>
            <Select
              value={calculation.materialType}
              onValueChange={(value: any) =>
                setCalculation({ ...calculation, materialType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MATERIAL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Largura: {calculation.width}m</Label>
              <Slider
                value={[calculation.width]}
                onValueChange={([value]) =>
                  setCalculation({ ...calculation, width: value })
                }
                min={1}
                max={10}
                step={0.5}
              />
            </div>
            <div className="space-y-3">
              <Label>Altura: {calculation.height}m</Label>
              <Slider
                value={[calculation.height]}
                onValueChange={([value]) =>
                  setCalculation({ ...calculation, height: value })
                }
                min={1}
                max={5}
                step={0.25}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Automacao</Label>
            <Select
              value={calculation.automationType}
              onValueChange={(value: any) =>
                setCalculation({ ...calculation, automationType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AUTOMATION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isPublic && (
             <Button className="w-full mt-4" size="lg" onClick={handleCalculate}>
               <Calculator className="mr-2 h-5 w-5" />
               Ver Preço Estimado
             </Button>
          )}

        </CardContent>
      </Card>

      {/* Se for público, não mostra o resultado detalhado imediatamente, apenas o teaser ou nada */}
      {(!isPublic || showResult) && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Estimativa de Custo
            </CardTitle>
            <CardDescription>
              Valores aproximados baseados na configuracao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Area Total
                </p>
                <div className="text-4xl font-bold">
                  {(calculation.width * calculation.height).toFixed(2)} m²
                </div>
              </div>
            </div>

            <Separator />

            {showPricing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Material Estimado</span>
                  <span>{formatCurrency(result.materialCost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mao de Obra</span>
                  <span>{formatCurrency(result.laborCost)}</span>
                </div>
                {result.automationCost > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Automacao</span>
                    <span>{formatCurrency(result.automationCost)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                
                {!isPublic && (
                  <Button className="w-full mt-4" onClick={handleCreateOrder}>
                    <FileText className="mr-2 h-4 w-4" />
                    Transformar em Orçamento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Total Estimado</span>
                  <span className="text-primary">{formatCurrency(result.totalPrice)}</span>
                </div>
              </div>
            )}
            
            {isPublic && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mt-4">
                 <div className="flex gap-3">
                   <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Desbloqueie o Orçamento Detalhado</h4>
                     <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                       Crie sua conta grátis para personalizar preços de materiais, margem de lucro e gerar PDF para seu cliente.
                     </p>
                   </div>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
