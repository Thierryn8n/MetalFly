"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { InitialConfigForm } from "@/components/calculator/initial-config-form"
import { 
  Zap, 
  Calculator, 
  DollarSign, 
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react"

interface OnboardingTutorialProps {
  userId: string
  onComplete: () => void
}

export function OnboardingTutorial({ userId, onComplete }: OnboardingTutorialProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 3
  const { toast } = useToast()

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleConfigComplete = () => {
    setStep(totalSteps)
    // Pequeno delay para mostrar a tela de conclusão
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Bem-vindo ao Metal Fly!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Vamos configurar sua calculadora de orçamentos personalizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Calculadora Inteligente</h3>
                    <p className="text-sm text-gray-600">Calcule orçamentos automáticos com base nas dimensões do portão</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Preços Personalizados</h3>
                    <p className="text-sm text-gray-600">Configure seus próprios valores de materiais e margens de lucro</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Seleção Automática</h3>
                    <p className="text-sm text-gray-600">O sistema escolhe o motor ideal baseado no peso do portão</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={nextStep} 
                className="w-full h-12 text-lg"
                size="lg"
              >
                Começar Configuração
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Configure seus Preços
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Preencha os valores base da sua calculadora. Você poderá alterá-los depois.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InitialConfigForm 
                userId={userId} 
                onConfigComplete={handleConfigComplete} 
              />
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Configuração Concluída!
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Sua calculadora está pronta para uso. Você será redirecionado em instantes...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">✅ Configurações de preço salvas</p>
                <p className="text-sm text-gray-600">✅ Produtos padrão cadastrados</p>
                <p className="text-sm text-gray-600">✅ Calculadora personalizada</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Progress value={(step / totalSteps) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span className={step >= 1 ? "text-primary font-medium" : ""}>Boas-vindas</span>
            <span className={step >= 2 ? "text-primary font-medium" : ""}>Configuração</span>
            <span className={step >= 3 ? "text-primary font-medium" : ""}>Conclusão</span>
          </div>
        </div>
        {renderStep()}
      </div>
    </div>
  )
}