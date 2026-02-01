"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ShieldCheck,
  Users,
  Store,
  Settings,
  LogOut,
  LayoutDashboard,
  Package,
  FileText
} from "lucide-react"

const adminNavItems = [
  {
    title: "Visão Geral",
    href: "/admin",
    icon: ShieldCheck,
  },
  {
    title: "Usuários",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Produtos",
    href: "/admin/produtos",
    icon: Package,
  },
  {
    title: "Academias",
    href: "/admin/academies",
    icon: Store,
  },
  {
    title: "Pedidos",
    href: "/admin/pedidos",
    icon: FileText,
  },
  {
    title: "Configurações",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-slate-50 flex flex-col h-screen border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <ShieldCheck className="h-6 w-6 text-blue-500 mr-2" />
        <span className="font-bold text-lg">Admin Master</span>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-800">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white">
            <LayoutDashboard className="h-4 w-4" />
            Voltar ao App
          </Button>
        </Link>
      </div>
    </aside>
  )
}
