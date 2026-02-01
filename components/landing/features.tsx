import { 
  Calculator, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  Shield,
  Smartphone,
  Zap
} from "lucide-react"

const features = [
  {
    icon: Calculator,
    title: "Calculadora Inteligente",
    description: "Configure suas margens de material, mao de obra e lucro. A calculadora faz o resto.",
  },
  {
    icon: Users,
    title: "Gestao de Clientes",
    description: "CRM completo para acompanhar seus clientes, historico de servicos e contatos.",
  },
  {
    icon: FileText,
    title: "Orcamentos Profissionais",
    description: "Gere PDFs personalizados com sua marca para enviar aos clientes.",
  },
  {
    icon: Settings,
    title: "Precos Personalizados",
    description: "Cada usuario configura seus proprios custos de material e valores de hora.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    description: "Acompanhe metricas importantes: orcamentos, vendas, ticket medio e mais.",
  },
  {
    icon: Shield,
    title: "Dados Seguros",
    description: "Seus dados e de seus clientes protegidos com criptografia de ponta.",
  },
  {
    icon: Smartphone,
    title: "Responsivo",
    description: "Acesse de qualquer dispositivo: computador, tablet ou celular.",
  },
  {
    icon: Zap,
    title: "Rapido e Intuitivo",
    description: "Interface moderna e facil de usar. Comece a usar em minutos.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo que voce precisa em um so lugar
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Ferramentas desenvolvidas especialmente para o dia a dia do instalador de portoes.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
