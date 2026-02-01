"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, Ruler, Weight, DollarSign, Plus, Settings, Play, ShoppingCart, ChevronUp, ChevronDown, Check } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { RecommendationPanel } from "./recommendation-panel"
import { BudgetModal } from "./budget-modal"
import { useAuth } from "@/lib/auth-context"

interface MotorModel {
  id: string
  name: string
  weight_min_kg: number
  weight_max_kg: number
  price: number
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  image_url?: string
}

interface CalculationResult {
  area: number
  weight: number
  bladeCost: number
  paintingCost: number
  motorCost: number
  accessoriesCost: number
  laborCost: number
  subtotal: number
  totalWithMargin: number
  selectedMotor: MotorModel | null
}

export function MetalFlyCalculator() {
  const router = useRouter()
  const { profile } = useAuth()
  const [width, setWidth] = useState<number>(3)
  const [height, setHeight] = useState<number>(3)
  const [bladePricePerM2, setBladePricePerM2] = useState<number>(180)
  const [paintingPricePerM2, setPaintingPricePerM2] = useState<number>(65)
  const [laborCostPerHour, setLaborCostPerHour] = useState<number>(80)
  const [profitMargin, setProfitMargin] = useState<number>(10)
  const [additionalCosts, setAdditionalCosts] = useState<number>(340)
  const [motorModels, setMotorModels] = useState<MotorModel[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  
  // Recommendation System State
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false)
  
  // Estado para controle da tabela de motores
  const [showAllMotors, setShowAllMotors] = useState(false)
  
  // Estado para controle do modal de orçamento
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  
  // Calculator input states for recommendations
  const [gateType, setGateType] = useState<'sliding' | 'swing' | 'sectional' | 'rolling'>('sliding')
  const [automationType, setAutomationType] = useState<'none' | 'basic' | 'premium'>('none')
  const [materialType, setMaterialType] = useState<'iron' | 'aluminum' | 'stainless'>('iron')
  
  const supabase = createBrowserClient()

  // Log para debug do profile
  useEffect(() => {
    console.log('MetalFlyCalculator - Profile:', profile)
    console.log('MetalFlyCalculator - User ID:', profile?.id)
  }, [profile])

  // Cálculo do peso da porta (10kg por m² + 30% de folga)
  const area = width * height
  const weight = area * 10 * 1.3 // 10kg por m² + 30% de folga

  // Selecionar motor baseado no peso
  const selectedMotor = motorModels.find(motor => 
    weight >= motor.weight_min_kg && weight <= motor.weight_max_kg
  ) || null

  // Cálculos baseados na planilha
  const bladeCost = area * bladePricePerM2
  const paintingCost = area * paintingPricePerM2
  const motorCost = selectedMotor?.price || 0
  const laborCost = (area * 2) * laborCostPerHour // Estimativa de 2 horas por m²
  const subtotal = bladeCost + paintingCost + motorCost + laborCost + additionalCosts
  const totalWithMargin = subtotal * (1 + profitMargin / 100)

  useEffect(() => {
    fetchData()
  }, [])



  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar modelos de motores
      const { data: motorsData, error: motorsError } = await supabase
        .from('motor_models')
        .select('*')
        .eq('is_active', true)
        .order('weight_min_kg')

      if (motorsError) {
        console.error('Erro ao buscar motores:', motorsError)
        toast.error('Erro ao carregar motores')
      } else {
        setMotorModels(motorsData || [])
      }

      // Buscar produtos relevantes (lâminas, pinturas, acessórios)
      let productsData = null
      let productsError = null
      
      try {
        // Primeiro tentar com a função de bypass para evitar recursão
        console.log('🔄 Tentando buscar produtos com bypass de recursão...')
        const { data: bypassData, error: bypassError } = await supabase
          .rpc('get_products_by_category_bypass', { 
            p_categories: ['laminas', 'tintas', 'acessorios', 'motores'] 
          })
        
        if (bypassError) {
          console.log('❌ Bypass falhou:', bypassError)
          
          // Se for erro de recursão, não tentar query direta
          if (bypassError.code === '42P17') {
            console.error('🚨 Recursão detectada no bypass! Pulando query direta.')
            productsError = bypassError
          } else {
            console.log('🔄 Tentando query direta...')
            // Se o bypass falhar por outro motivo, tentar query direta
            const result = await supabase
              .from('products')
              .select('*')
              .eq('is_active', true)
              .in('category', ['laminas', 'tintas', 'acessorios', 'motores'])
            
            productsData = result.data
            productsError = result.error
          }
        } else {
          console.log('✅ Produtos carregados com bypass de recursão')
          productsData = bypassData
          productsError = null
        }
      } catch (error) {
        console.error('🚨 Exceção ao buscar produtos:', error)
        productsError = error
      }

      if (productsError) {
        console.error('❌ Erro ao buscar produtos:', productsError)
        
        // Se ainda houver erro, usar fallback com lista vazia
        if (productsError?.code === '42P17') {
          console.error('🚨 Recursão ainda detectada! Verifique as políticas RLS no banco.')
          toast.error('Erro de configuração do banco de dados. Contate o administrador.')
        }
        
        console.log('📦 Usando fallback: lista de produtos vazia')
        setProducts([]) // Fallback: lista vazia
      } else {
        console.log(`✅ ${productsData?.length || 0} produtos carregados com sucesso`)
        setProducts(productsData || [])
      }

      // Buscar configurações de preços do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: configData, error: configError } = await supabase
          .from('pricing_configs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!configError && configData) {
          setBladePricePerM2(Number(configData.blade_price_per_m2) || 180)
          setPaintingPricePerM2(Number(configData.painting_price_per_m2) || 65)
          setLaborCostPerHour(Number(configData.labor_hourly_rate) || 80)
          setProfitMargin(Number(configData.profit_margin) || 10)
          setAdditionalCosts(Number(configData.additional_costs) || 340)
        }
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const saveConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Você precisa estar logado para salvar configurações')
        return
      }

      const { error } = await supabase
        .from('pricing_configs')
        .upsert({
          user_id: user.id,
          price_blade_m2: bladePricePerM2,
          price_painting_m2: paintingPricePerM2,
          labor_cost_per_hour: laborCostPerHour,
          profit_margin: profitMargin,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      toast.success('Configurações salvas com sucesso!')
      setShowConfig(false)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Calculator className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-32"> {/* Padding bottom for the fixed panel */}
      {/* Formulário de Configuração Inicial */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração de Preços
            </CardTitle>
            <CardDescription>
              Configure os valores base para seus orçamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bladePrice">Valor da Lâmina por m² (R$)</Label>
                <Input
                  id="bladePrice"
                  type="number"
                  value={bladePricePerM2}
                  onChange={(e) => setBladePricePerM2(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="paintingPrice">Valor da Pintura por m² (R$)</Label>
                <Input
                  id="paintingPrice"
                  type="number"
                  value={paintingPricePerM2}
                  onChange={(e) => setPaintingPricePerM2(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="laborCost">Custo da Mão de Obra por Hora (R$)</Label>
                <Input
                  id="laborCost"
                  type="number"
                  value={laborCostPerHour}
                  onChange={(e) => setLaborCostPerHour(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveConfiguration}>Salvar Configurações</Button>
              <Button variant="outline" onClick={() => setShowConfig(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculadora Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Entradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Medidas do Portão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Largura (m)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (m)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Área Total</span>
                <Badge variant="secondary">{area.toFixed(2)} m²</Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">Peso Estimado</span>
                <Badge variant="secondary">{weight.toFixed(1)} kg</Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="additional">Adicionais (R$)</Label>
              <Input
                id="additional"
                type="number"
                value={additionalCosts}
                onChange={(e) => setAdditionalCosts(Number(e.target.value))}
              />
            </div>

            {/* Novos controles para recomendações */}
            <div>
              <Label htmlFor="gateType">Tipo de Portão</Label>
              <Select value={gateType} onValueChange={(value: any) => setGateType(value)}>
                <SelectTrigger id="gateType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sliding">Deslizante</SelectItem>
                  <SelectItem value="swing">Balança</SelectItem>
                  <SelectItem value="sectional">Seccional</SelectItem>
                  <SelectItem value="rolling">Rolante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="automationType">Automação</Label>
              <Select value={automationType} onValueChange={(value: any) => setAutomationType(value)}>
                <SelectTrigger id="automationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Automação</SelectItem>
                  <SelectItem value="basic">Básica</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="materialType">Material</Label>
              <Select value={materialType} onValueChange={(value: any) => setMaterialType(value)}>
                <SelectTrigger id="materialType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iron">Ferro</SelectItem>
                  <SelectItem value="aluminum">Alumínio</SelectItem>
                  <SelectItem value="stainless">Inox</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => setShowConfig(true)} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Preços
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Orçamento Detalhado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Motor Selecionado */}
            {selectedMotor && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Motor Recomendado: {selectedMotor.name}
                  </span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Para portão de {weight.toFixed(1)}kg • R$ {selectedMotor.price.toFixed(2)}
                </p>
              </div>
            )}

            {/* Detalhamento dos Custos */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Lâmina ({area.toFixed(2)}m² × R$ {bladePricePerM2}/m²)</span>
                <span>R$ {bladeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pintura ({area.toFixed(2)}m² × R$ {paintingPricePerM2}/m²)</span>
                <span>R$ {paintingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Mão de Obra</span>
                <span>R$ {laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Motor</span>
                <span>R$ {motorCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Adicionais</span>
                <span>R$ {additionalCosts.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Margem de Lucro ({profitMargin}%)</span>
                <span>R$ {(subtotal * profitMargin / 100).toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Total Final */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total do Orçamento</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {totalWithMargin.toFixed(2)}
              </span>
            </div>

            {/* Botão de Ação */}
            <Button className="w-full" size="lg" onClick={() => {
              console.log('=== CRIAR PEDIDO CLICKADO ===')
              console.log('Profile disponível:', profile)
              console.log('Profile ID:', profile?.id)
              if (!profile) {
                toast.error('Você precisa estar logado para criar um orçamento')
                return
              }
              setIsBudgetModalOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Pedido
            </Button>

            {/* Botão para Recomendações Inteligentes */}
            <Button 
              className="w-full mt-2" 
              variant="outline" 
              onClick={() => setIsRecommendationOpen(true)}
              disabled={!selectedMotor || totalWithMargin === 0}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ver Recomendações Inteligentes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Motores para Referência */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowAllMotors(!showAllMotors)}>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-lg">Tabela de Motores</CardTitle>
              <CardDescription>
                {showAllMotors 
                  ? "Exibindo todos os motores disponíveis" 
                  : selectedMotor 
                    ? `Motor selecionado: ${selectedMotor.name}`
                    : "Nenhum motor compatível encontrado"}
              </CardDescription>
            </div>
            {showAllMotors ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </CardHeader>
        {(showAllMotors || selectedMotor) && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Motor</th>
                    <th className="text-left p-2">Capacidade (kg)</th>
                    <th className="text-left p-2">Preço (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {motorModels
                    .filter(motor => showAllMotors || (selectedMotor && motor.id === selectedMotor.id))
                    .map((motor) => (
                    <tr key={motor.id} className={`border-b ${selectedMotor?.id === motor.id ? 'bg-blue-50' : ''}`}>
                      <td className="p-2 font-medium">{motor.name}</td>
                      <td className="p-2">
                        {motor.weight_min_kg} - {motor.weight_max_kg}
                      </td>
                      <td className="p-2">R$ {motor.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!showAllMotors && selectedMotor && (
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setShowAllMotors(true)}>
                    Ver todos os motores
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Área de Anúncio do Curso */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Play className="h-5 w-5" />
            Aprenda a Fabricar este Portão
          </CardTitle>
          <CardDescription>
            Assista a aulas gratuitas do nosso curso profissionalizante e domine a técnica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-black/10 rounded-lg flex items-center justify-center relative group cursor-pointer hover:bg-black/20 transition-colors">
                <div className="bg-white/90 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-primary fill-primary" />
                </div>
                <span className="absolute bottom-2 left-2 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded">
                  Aula Gratuita {i}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="default" onClick={() => router.push('/dashboard/academy')}>
            Assinar Premium para Acesso Completo
          </Button>
        </CardFooter>
      </Card>

      {/* Painel de Recomendações Inteligentes */}
      <RecommendationPanel
        isOpen={isRecommendationOpen}
        onClose={() => setIsRecommendationOpen(false)}
        budget={totalWithMargin}
        gateType={gateType}
        automationType={automationType}
        materialType={materialType}
      />

      {/* Modal de Orçamento */}
      <BudgetModal
        open={isBudgetModalOpen}
        onOpenChange={setIsBudgetModalOpen}
        calculationData={{
          area,
          weight,
          subtotal,
          totalWithMargin,
          profitMargin,
          selectedMotor: selectedMotor ? { name: selectedMotor.name, price: selectedMotor.price } : undefined,
          bladeCost,
          paintingCost,
          motorCost,
          accessoriesCost: additionalCosts,
          laborCost,
          width,
          height
        }}
        profile={profile}
      />
    </div>
  )
}