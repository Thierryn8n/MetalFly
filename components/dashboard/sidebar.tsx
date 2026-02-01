"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Zap, 
  LayoutDashboard, 
  Calculator, 
  DollarSign,
  Users, 
  FileText, 
  Settings, 
  ShoppingBag, 
  GraduationCap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import { SessionRecovery } from "@/components/auth/session-recovery"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Calculadora",
    href: "/dashboard/calculator",
    icon: Calculator,
  },
  {
    title: "Preços",
    href: "/dashboard/pricing-config",
    icon: DollarSign,
  },
  {
    title: "Orçamentos",
    href: "/dashboard/budgets",
    icon: FileText,
  },
  {
    title: "Clientes",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Orcamentos",
    href: "/dashboard/orders",
    icon: FileText,
  },
  {
    title: "Loja",
    href: "/dashboard/store",
    icon: ShoppingBag,
  },
  {
    title: "Academy",
    href: "/dashboard/academy",
    icon: GraduationCap,
  },
  {
    title: "Configuracoes",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface DashboardSidebarProps {
  floating?: boolean
  rounded?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function DashboardSidebar({ 
  floating = false, 
  rounded = false, 
  collapsed = true, 
  onToggleCollapse 
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const { signOut, profile } = useAuth()
  
  // Debug profile role
  console.log("DashboardSidebar - Profile:", profile)
  console.log("DashboardSidebar - Profile Role:", profile?.role)
  console.log("DashboardSidebar - Is Admin?", profile?.role === 'admin')
  
  // Show admin button if profile exists and has admin or admin_master role
  const showAdminButton = profile && (profile.role === 'admin' || profile.role === 'admin_master')

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        floating && "fixed left-4 top-4 bottom-4 z-40 shadow-2xl",
        rounded && "rounded-2xl",
        floating && rounded && "border border-border/50"
      )
    }>
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary shrink-0">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold">Metal Fly</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}

          {showAdminButton && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <ShieldCheck className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Admin Master</span>}
            </Link>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        {!collapsed && (
          <div className="mb-3 px-3">
            <SessionRecovery />
          </div>
        )}
        {!collapsed && profile && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium truncate">{profile.full_name || "Usuario"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            <p className="text-xs text-muted-foreground truncate">Role: {profile.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </aside>
  )
}
