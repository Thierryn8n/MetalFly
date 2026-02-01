"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Zap, Menu, X } from "lucide-react"
import { useState } from "react"

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Metal Fly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="#calculator" className="text-sm font-medium hover:text-primary transition-colors">
            Calculadora
          </Link>
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Recursos
          </Link>
          <Link href="#academy" className="text-sm font-medium hover:text-primary transition-colors">
            Academy
          </Link>
          <Link href="#store" className="text-sm font-medium hover:text-primary transition-colors">
            Loja
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Comecar Gratis</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container flex flex-col gap-2 p-4">
            <Link
              href="#calculator"
              className="text-sm font-medium p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Calculadora
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Recursos
            </Link>
            <Link
              href="#academy"
              className="text-sm font-medium p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Academy
            </Link>
            <Link
              href="#store"
              className="text-sm font-medium p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Loja
            </Link>
            <div className="flex flex-col gap-2 pt-2 border-t mt-2">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Comecar Gratis</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
