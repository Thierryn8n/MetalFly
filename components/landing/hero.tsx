import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calculator, ShoppingBag, GraduationCap } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="container relative px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            Novo: Academy com cursos gratuitos
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
            Gestao completa para{" "}
            <span className="text-primary">instaladores de portoes</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
            Calcule orcamentos em segundos, gerencie seus clientes, compre insumos com 
            desconto e aprenda novas tecnicas. Tudo em uma unica plataforma.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Comecar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#calculator">
                <Calculator className="mr-2 h-4 w-4" />
                Testar Calculadora
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
            <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Calculadora de Orcamentos</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure seus precos e margens. Gere orcamentos profissionais em segundos.
            </p>
          </div>

          <div className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-accent/50">
            <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-3">
              <ShoppingBag className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Loja de Insumos B2B</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Compre motores, controles e acessorios diretamente com precos exclusivos.
            </p>
          </div>

          <div className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
            <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Academy</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cursos exclusivos sobre instalacao, manutencao e tecnicas avancadas.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
