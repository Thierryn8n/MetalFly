import { GateCalculator } from "@/components/calculator/gate-calculator"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de Orçamentos</h1>
          <p className="mt-2 text-muted-foreground">Digite as especificações do portão e veja o orçamento instantâneo.</p>
        </div>
        <GateCalculator isPublic={true} showPricing={false} />
      </div>
    </main>
  )
}
