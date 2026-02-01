"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Lightbulb, TrendingUp, Shield, Zap, Palette } from "lucide-react"

interface RecommendationPanelProps {
  isOpen: boolean
  onClose: () => void
  budget: number
  gateType: 'sliding' | 'swing' | 'sectional' | 'rolling'
  automationType: 'none' | 'basic' | 'premium'
  materialType: 'iron' | 'aluminum' | 'stainless'
}

export function RecommendationPanel({
  isOpen,
  onClose,
  budget,
  gateType,
  automationType,
  materialType,
}: RecommendationPanelProps) {
  
  // Logic to generate recommendations based on props
  const getRecommendations = () => {
    const recommendations = []

    if (automationType === 'none') {
      recommendations.push({
        title: "Automatize seu portão",
        description: "Adicione um motor para maior conforto e segurança. Portões automáticos são muito mais práticos no dia a dia.",
        benefit: "Valoriza o imóvel em até 5%",
        icon: <Zap className="h-5 w-5 text-yellow-500" />
      })
    } else if (automationType === 'basic') {
       recommendations.push({
        title: "Upgrade para Automação Premium",
        description: "Motores rápidos com bateria de backup garantem funcionamento mesmo sem energia.",
        benefit: "Maior velocidade e confiabilidade",
        icon: <Zap className="h-5 w-5 text-yellow-500" />
      })
    }

    if (materialType === 'iron') {
      recommendations.push({
        title: "Considere Alumínio",
        description: "O alumínio é mais leve, não enferruja e exige menos manutenção que o ferro.",
        benefit: "Durabilidade 3x maior",
        icon: <Shield className="h-5 w-5 text-blue-500" />
      })
    }
    
    if (gateType === 'swing') {
        recommendations.push({
            title: "Portão Deslizante",
            description: "Portões deslizantes economizam espaço na calçada e na garagem.",
            benefit: "Melhor aproveitamento de espaço",
            icon: <TrendingUp className="h-5 w-5 text-green-500" />
        })
    }

    recommendations.push({
        title: "Acabamento Premium",
        description: "Uma pintura eletrostática garante melhor acabamento e proteção contra intempéries.",
        benefit: "Estética superior e proteção",
        icon: <Palette className="h-5 w-5 text-purple-500" />
    })

    return recommendations
  }

  const recommendations = getRecommendations()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recomendações Inteligentes
          </SheetTitle>
          <SheetDescription>
            Baseado no seu orçamento de R$ {budget.toFixed(2)}, separamos algumas sugestões para valorizar seu projeto.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
          <div className="space-y-6">
            {recommendations.map((item, index) => (
              <div key={index} className="bg-muted/50 p-4 rounded-lg border border-border/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-background p-2 rounded-full shadow-sm border border-border">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded w-fit">
                      <TrendingUp className="h-3 w-3" />
                      {item.benefit}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-6">
          <Button onClick={onClose} className="w-full">
            Entendi, obrigado
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
