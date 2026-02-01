"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Plus, Calculator } from "lucide-react"
import { useRouter } from "next/navigation"

export function BudgetHeader() {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Meus Orçamentos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Gerencie todos os seus orçamentos de portões metálicos
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/calculator')}>
            <Calculator className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-blue-800">Orçamentos Pendentes</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-green-800">Orçamentos Aprovados</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">R$ 0,00</div>
            <div className="text-sm text-purple-800">Total em Orçamentos</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}