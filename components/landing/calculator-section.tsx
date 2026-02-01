import { GateCalculator } from "@/components/calculator/gate-calculator"
import { Badge } from "@/components/ui/badge"

export function CalculatorSection() {
  return (
    <section id="calculator" className="py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Experimente Gratis
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Calculadora de Orcamentos
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Teste nossa calculadora com valores de demonstracao. 
            Cadastre-se para personalizar seus precos.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <GateCalculator />
        </div>
      </div>
    </section>
  )
}
