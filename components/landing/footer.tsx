import Link from "next/link"
import { Zap } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Metal Fly</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Plataforma completa para instaladores de portoes automaticos. 
              Orcamentos, gestao de clientes, loja de insumos e cursos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#calculator" className="hover:text-foreground transition-colors">
                  Calculadora
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="#academy" className="hover:text-foreground transition-colors">
                  Academy
                </Link>
              </li>
              <li>
                <Link href="#store" className="hover:text-foreground transition-colors">
                  Loja
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Conta</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/auth/login" className="hover:text-foreground transition-colors">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                  Criar Conta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Metal Fly - Gestao e Academy. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
