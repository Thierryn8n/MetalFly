"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { PricingConfig } from "@/lib/types"
import { Loader2, CheckCircle, Settings, DollarSign, User } from "lucide-react"

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Profile form
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  
  // Pricing form
  const [materialMargin, setMaterialMargin] = useState(30)
  const [laborHourlyRate, setLaborHourlyRate] = useState(80)
  const [profitMargin, setProfitMargin] = useState(25)
  
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return

      setFullName(profile.full_name || "")
      setCompanyName(profile.company_name || "")
      setPhone(profile.phone || "")

      const { data } = await supabase
        .from("pricing_configs")
        .select("*")
        .eq("user_id", profile.id)
        .single()

      if (data) {
        setPricingConfig(data as PricingConfig)
        setMaterialMargin(data.material_margin)
        setLaborHourlyRate(data.labor_hourly_rate)
        setProfitMargin(data.profit_margin)
      }
      setLoading(false)
    }

    fetchData()
  }, [profile])

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    setSuccess(false)

    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    await refreshProfile()
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const savePricing = async () => {
    if (!profile) return
    setSaving(true)
    setSuccess(false)

    if (pricingConfig) {
      await supabase
        .from("pricing_configs")
        .update({
          material_margin: materialMargin,
          labor_hourly_rate: laborHourlyRate,
          profit_margin: profitMargin,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.id)
    } else {
      await supabase
        .from("pricing_configs")
        .insert({
          user_id: profile.id,
          material_margin: materialMargin,
          labor_hourly_rate: laborHourlyRate,
          profit_margin: profitMargin,
        })
    }

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil e configuracoes de precos.
        </p>
      </div>

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Configuracoes salvas com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Precos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informacoes pessoais e da empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Configuracao de Precos</CardTitle>
              <CardDescription>
                Defina suas margens e valores para calcular orcamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="materialMargin">Margem sobre Material (%)</Label>
                  <Input
                    id="materialMargin"
                    type="number"
                    value={materialMargin}
                    onChange={(e) => setMaterialMargin(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentual adicionado ao custo do material
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="laborHourlyRate">Valor Hora (R$)</Label>
                  <Input
                    id="laborHourlyRate"
                    type="number"
                    value={laborHourlyRate}
                    onChange={(e) => setLaborHourlyRate(parseFloat(e.target.value) || 0)}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado por hora de trabalho
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentual de lucro sobre o total
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Como funciona o calculo
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Custo do material + margem de material</li>
                  <li>2. Horas de trabalho x valor da hora</li>
                  <li>3. Subtotal + margem de lucro = Preco Final</li>
                </ul>
              </div>

              <Button onClick={savePricing} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Configuracoes de Preco
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
