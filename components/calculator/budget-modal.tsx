"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Phone, Share2, Download, ShoppingCart, Plus, Eye } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import { createBrowserClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BudgetItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
  category: string
}

interface BudgetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calculationData: {
    area: number
    weight: number
    subtotal: number
    totalWithMargin: number
    profitMargin: number
    selectedMotor?: {
      name: string
      price: number
    }
    bladeCost: number
    paintingCost: number
    motorCost: number
    accessoriesCost: number
    laborCost: number
    width: number
    height: number
  }
  profile: any
}

export function BudgetModal({ open, onOpenChange, calculationData, profile }: BudgetModalProps) {
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [showEcommerce, setShowEcommerce] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'share' | 'ecommerce' | null>(null)
  const supabase = createBrowserClient()

  // Log para debug
  useEffect(() => {
    console.log('=== BUDGETMODAL AUTH DEBUG ===')
    console.log('Profile recebido:', profile)
    console.log('Profile ID:', profile?.id)
    console.log('Modal aberto:', open)
  }, [profile, open])

  // Carregar dados do localStorage quando o modal abrir
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('budget_client_data')
        if (savedData) {
          const data = JSON.parse(savedData)
          setClientName(data.clientName || '')
          setClientPhone(data.clientPhone || '')
          setNotes(data.notes || '')
          console.log('✅ Dados do cliente carregados do localStorage')
        }
      } catch (error) {
        console.error('Erro ao carregar dados do localStorage:', error)
      }
    }
  }, [open])

  // Função debounce para salvamento automático
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  // Salvamento automático no localStorage
  const saveToLocalStorage = debounce(() => {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          clientName,
          clientPhone,
          notes,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('budget_client_data', JSON.stringify(data))
        console.log('✅ Dados salvos automaticamente no localStorage')
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error)
      }
    }
  }, 500) // 500ms de delay

  // Executar salvamento automático quando os dados mudarem
  useEffect(() => {
    if (open) {
      saveToLocalStorage()
    }
  }, [clientName, clientPhone, notes, open])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const formatDate = (date: Date) =>
    format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const budgetItems: BudgetItem[] = [
    {
      name: "Lâminas de Aço",
      quantity: 1,
      unitPrice: calculationData.bladeCost,
      total: calculationData.bladeCost,
      category: "materiais"
    },
    {
      name: "Pintura",
      quantity: 1,
      unitPrice: calculationData.paintingCost,
      total: calculationData.paintingCost,
      category: "serviços"
    },
    {
      name: calculationData.selectedMotor?.name || "Motor",
      quantity: 1,
      unitPrice: calculationData.motorCost,
      total: calculationData.motorCost,
      category: "componentes"
    },
    {
      name: "Acessórios",
      quantity: 1,
      unitPrice: calculationData.accessoriesCost,
      total: calculationData.accessoriesCost,
      category: "componentes"
    },
    {
      name: "Mão de Obra",
      quantity: 1,
      unitPrice: calculationData.laborCost,
      total: calculationData.laborCost,
      category: "serviços"
    }
  ]

  const testSupabaseConnection = async () => {
    try {
      console.log('=== TESTANDO CONEXÃO SUPABASE ===')
      console.log('Supabase client:', supabase)
      
      // Testar se conseguimos fazer uma query simples
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .limit(1)
      
      console.log('Teste de conexão - Data:', data)
      console.log('Teste de conexão - Error:', error)
      
      if (error) {
        console.error('Erro na conexão:', error)
        return false
      }
      
      console.log('✅ Conexão com Supabase funcionando!')
      return true
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error)
      return false
    }
  }

  const handleSaveBudget = async () => {
    console.log('=== INICIANDO SALVAMENTO DO ORÇAMENTO ===')
    console.log('Client Name:', clientName)
    console.log('Client Phone:', clientPhone)
    console.log('Profile:', profile)
    console.log('User ID:', profile?.id)
    console.log('Calculation Data:', calculationData)
    console.log('Formato escolhido:', selectedFormat)
    
    if (!clientName.trim()) {
      toast.error("Por favor, insira o nome do cliente")
      return
    }

    if (!selectedFormat) {
      toast.error("Por favor, escolha como deseja usar o orçamento")
      return
    }

    // Testar conexão antes de salvar
    const connectionOk = await testSupabaseConnection()
    if (!connectionOk) {
      toast.error("Erro de conexão com o banco de dados. Tente novamente.")
      return
    }

    setLoading(true)
    try {
      console.log('Iniciando salvamento do orçamento...')
      console.log('Profile:', profile)
      
      if (!profile?.id) {
        console.error('Usuário não está logado')
        toast.error("Você precisa estar logado para salvar orçamentos")
        return
      }

      // Validar dados antes de enviar
      console.log('Validando dados do orçamento...')
      
      if (!profile.id) {
        throw new Error('user_id é obrigatório')
      }
      if (!clientName?.trim()) {
        throw new Error('client_name é obrigatório')
      }
      if (!calculationData.width || calculationData.width <= 0) {
        throw new Error('width deve ser maior que 0')
      }
      if (!calculationData.height || calculationData.height <= 0) {
        throw new Error('height deve ser maior que 0')
      }
      if (!calculationData.area || calculationData.area <= 0) {
        throw new Error('area deve ser maior que 0')
      }
      if (!calculationData.bladeCost || calculationData.bladeCost < 0) {
        throw new Error('blade_price_applied deve ser maior ou igual a 0')
      }
      if (!calculationData.totalWithMargin || calculationData.totalWithMargin < 0) {
        throw new Error('total_price deve ser maior ou igual a 0')
      }

      const orderData = {
        user_id: profile.id,
        client_name: clientName.trim(),
        client_phone: clientPhone?.trim() || null,
        width: Number(calculationData.width),
        height: Number(calculationData.height),
        area: Number(calculationData.area),
        weight: calculationData.weight ? Number(calculationData.weight) : null,
        blade_price_applied: Number(calculationData.bladeCost),
        painting_price_total: calculationData.paintingCost ? Number(calculationData.paintingCost) : 0,
        motor_cost: calculationData.motorCost ? Number(calculationData.motorCost) : 0,
        motor_model: calculationData.selectedMotor?.name || null,
        additional_cost: Number(calculationData.accessoriesCost + calculationData.laborCost),
        additional_notes: notes?.trim() || null,
        total_price: Number(calculationData.totalWithMargin),
        status: 'draft'
      }

      console.log('✅ Dados validados com sucesso')
      console.log('Dados do orçamento:', JSON.stringify(orderData, null, 2))
      console.log('Supabase client:', supabase)
      console.log('Supabase from orders:', supabase.from('orders'))

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (error) {
        console.error('❌ ERRO AO SALVAR ORÇAMENTO ===')
        console.error('Código do erro:', error.code)
        console.error('Mensagem:', error.message)
        console.error('Detalhes:', error.details)
        console.error('Hint:', error.hint)
        console.error('Erro completo:', JSON.stringify(error, null, 2))
        
        let errorMessage = error.message
        
        // Tratamento específico para erros comuns
        if (error.code === '42501') {
          errorMessage = 'Permissão negada. Verifique se você está logado e se o RLS está configurado corretamente.'
        } else if (error.code === '23505') {
          errorMessage = 'Registro duplicado. Este orçamento já existe.'
        } else if (error.code === '23503') {
          errorMessage = 'Erro de chave estrangeira. Verifique os dados relacionados.'
        } else if (error.code === '23502') {
          errorMessage = 'Campo obrigatório não preenchido.'
        }
        
        toast.error(`Erro ao salvar orçamento: ${errorMessage}`)
        return
      }

      console.log('Orçamento salvo com sucesso:', data)
      
      // Limpar dados do localStorage após salvar com sucesso
      if (typeof window !== 'undefined') {
        localStorage.removeItem('budget_client_data')
        console.log('✅ Dados do localStorage limpos após salvamento')
      }
      
      // Executar ação baseada no formato escolhido
      if (selectedFormat === 'share') {
        await handleShareBudget()
      } else if (selectedFormat === 'pdf') {
        handleDownloadPDF()
      } else if (selectedFormat === 'ecommerce') {
        handleViewEcommerce()
      }
      
      toast.success("Orçamento salvo com sucesso!")
      
      // Aguardar um pouco antes de fechar para o usuário ver a mensagem
      setTimeout(() => {
        onOpenChange(false)
        // Redirecionar para página de orçamentos
        if (selectedFormat !== 'ecommerce') {
          window.location.href = '/dashboard/budgets'
        }
      }, 2000)
      
    } catch (error) {
      console.error('❌ ERRO CAPTURADO NO CATCH ===')
      console.error('Tipo do erro:', typeof error)
      console.error('Erro completo:', error)
      
      if (error instanceof Error) {
        console.error('Nome do erro:', error.name)
        console.error('Mensagem:', error.message)
        console.error('Stack:', error.stack)
      } else {
        console.error('Erro não é uma instância de Error:', error)
        console.error('String do erro:', String(error))
      }
      
      // Verificar se é um erro do Supabase
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('Erro do Supabase detectado:', error)
      }
      
      toast.error(`Erro ao processar orçamento: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleShareBudget = async () => {
    if (!clientName.trim()) {
      toast.error("Por favor, insira o nome do cliente antes de compartilhar")
      return
    }

    const budgetText = `
🚪 **ORÇAMENTO PORTÃO METÁLICO**

📅 **Data:** ${formatDate(new Date())}
👤 **Cliente:** ${clientName || "Não informado"}
📱 **Telefone:** ${clientPhone || "Não informado"}
📏 **Dimensões:** ${calculationData.width}m x ${calculationData.height}m (Área: ${calculationData.area}m²)

📋 **ITENS DO ORÇAMENTO:**
${budgetItems.map(item => 
  `• ${item.name}: ${formatCurrency(item.total)}`
).join('\n')}

💰 **TOTAL:** ${formatCurrency(calculationData.totalWithMargin)}

📞 Entre em contato para mais informações!
    `.trim()

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Orçamento - ${clientName || "Portão Metálico"}`,
          text: budgetText
        })
      } catch (error) {
        // Fallback para copiar
        navigator.clipboard.writeText(budgetText)
        toast.success("Orçamento copiado para a área de transferência!")
      }
    } else {
      // Fallback para copiar
      navigator.clipboard.writeText(budgetText)
      toast.success("Orçamento copiado para a área de transferência!")
    }
    
    setSelectedFormat('share')
  }

  const handleDownloadPDF = () => {
    if (!clientName.trim()) {
      toast.error("Por favor, insira o nome do cliente antes de baixar")
      return
    }

    try {
      // Criar um novo documento PDF
      const doc = new jsPDF()
      
      // Configurar fonte e tamanho
      doc.setFont('helvetica')
      
      // Título
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 0)
      doc.text('ORÇAMENTO PORTÃO METÁLICO', 105, 20, { align: 'center' })
      
      // Informações da empresa
      doc.setFontSize(12)
      doc.setTextColor(128, 128, 128)
      doc.text('Metal Fly - Portões de Qualidade', 105, 28, { align: 'center' })
      doc.text(formatDate(new Date()), 105, 35, { align: 'center' })
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 40, 190, 40)
      
      // Informações do cliente
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('DADOS DO CLIENTE', 20, 50)
      doc.setFontSize(10)
      doc.text(`Cliente: ${clientName || "Não informado"}`, 20, 58)
      doc.text(`Telefone: ${clientPhone || "Não informado"}`, 20, 65)
      doc.text(`Dimensões: ${calculationData.width}m x ${calculationData.height}m`, 20, 72)
      doc.text(`Área: ${calculationData.area}m²`, 20, 79)
      
      // Itens do orçamento
      doc.setFontSize(12)
      doc.text('ITENS DO ORÇAMENTO', 20, 90)
      
      let yPosition = 98
      budgetItems.forEach((item, index) => {
        doc.setFontSize(10)
        doc.text(`${index + 1}. ${item.name}`, 20, yPosition)
        doc.text(formatCurrency(item.total), 160, yPosition, { align: 'right' })
        yPosition += 7
      })
      
      // Total
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPosition + 5, 190, yPosition + 5)
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'bold')
      doc.text('TOTAL:', 20, yPosition + 15)
      doc.text(formatCurrency(calculationData.totalWithMargin), 160, yPosition + 15, { align: 'right' })
      
      // Mensagem final
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      doc.setTextColor(128, 128, 128)
      doc.text('Obrigado pela preferência!', 105, yPosition + 30, { align: 'center' })
      
      // Salvar o PDF
      const fileName = `orcamento-${clientName.replace(/\s+/g, '-').toLowerCase() || 'portao'}-${format(new Date(), 'dd-MM-yyyy')}.pdf`
      doc.save(fileName)
      
      toast.success("Orçamento baixado com sucesso!")
      setSelectedFormat('pdf')
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error("Erro ao gerar PDF. Tente novamente.")
    }
  }

  const handleViewEcommerce = () => {
    if (!clientName.trim()) {
      toast.error("Por favor, insira o nome do cliente antes de ver o e-commerce")
      return
    }
    setSelectedFormat('ecommerce')
    setShowEcommerce(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[95vw] lg:w-[90vw] xl:w-[85vw] 2xl:max-w-7xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Criar Orçamento
        </DialogTitle>
        <DialogDescription>
          Escolha como deseja usar o orçamento e preencha os dados do cliente
        </DialogDescription>
      </DialogHeader>

      {/* Seção de Escolha de Formato */}


      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        {/* Formulário de Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite o nome do cliente"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="clientPhone">Telefone</Label>
              <Input
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do Orçamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dimensões:</span>
              <span className="font-medium">{calculationData.width}m × {calculationData.height}m</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Área Total:</span>
              <span className="font-medium">{calculationData.area}m²</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Peso Estimado:</span>
              <span className="font-medium">{calculationData.weight}kg</span>
            </div>

            <Separator className="my-2" />
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {budgetItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-green-600">{formatCurrency(calculationData.totalWithMargin)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Escolha de Formato */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Como deseja usar este orçamento?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            <Button
              variant={selectedFormat === 'pdf' ? 'default' : 'outline'}
              className="flex-col h-auto py-3 sm:py-4 px-2 sm:px-3 text-sm sm:text-base"
              onClick={handleDownloadPDF}
            >
              <Download className="h-6 w-6 mb-2" />
              <span className="font-medium">Baixar PDF</span>
              <span className="text-xs mt-1 opacity-75">Salvar arquivo no computador</span>
            </Button>
            
            <Button
              variant={selectedFormat === 'share' ? 'default' : 'outline'}
              className="flex-col h-auto py-3 sm:py-4 px-2 sm:px-3 text-sm sm:text-base"
              onClick={handleShareBudget}
            >
              <Share2 className="h-6 w-6 mb-2" />
              <span className="font-medium">Compartilhar</span>
              <span className="text-xs mt-1 opacity-75">Enviar por WhatsApp/email</span>
            </Button>
            
            <Button
              variant={selectedFormat === 'ecommerce' ? 'default' : 'outline'}
              className="flex-col h-auto py-3 sm:py-4 px-2 sm:px-3 text-sm sm:text-base"
              onClick={handleViewEcommerce}
            >
              <Eye className="h-6 w-6 mb-2" />
              <span className="font-medium">Ver E-commerce</span>
              <span className="text-xs mt-1 opacity-75">Ver produtos relacionados</span>
            </Button>
          </div>
          
          {selectedFormat && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✅ Formato escolhido: <strong>
                  {selectedFormat === 'pdf' && 'Baixar PDF'}
                  {selectedFormat === 'share' && 'Compartilhar'}
                  {selectedFormat === 'ecommerce' && 'Ver E-commerce'}
                </strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
        <div className="flex gap-2 flex-1 sm:flex-none">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          
          <Button 
            onClick={handleSaveBudget} 
            disabled={loading || !selectedFormat || !clientName.trim()}
            className="flex-1 sm:flex-none min-w-[140px] sm:min-w-[160px]"
          >
            {loading && <Plus className="h-4 w-4 mr-2 animate-spin" />}
            {!selectedFormat ? 'Escolha formato' : 'Salvar Orçamento'}
          </Button>
        </div>
        
        {selectedFormat && (
          <div className="text-sm text-muted-foreground text-center sm:text-right order-first sm:order-none">
            Formato: <strong>
              {selectedFormat === 'pdf' && 'PDF'}
              {selectedFormat === 'share' && 'Compartilhar'}
              {selectedFormat === 'ecommerce' && 'E-commerce'}
            </strong>
          </div>
        )}
      </DialogFooter>

      {showEcommerce && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Conexão com E-commerce</h3>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade está em desenvolvimento. Em breve você poderá enviar este orçamento diretamente para o e-commerce.
            </p>
            <Button onClick={() => setShowEcommerce(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
  )
}