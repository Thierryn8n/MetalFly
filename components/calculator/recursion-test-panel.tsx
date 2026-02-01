"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export function RecursionTestPanel() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<{
    products: boolean | null
    profile: boolean | null
    motors: boolean | null
    error?: string
  }>({
    products: null,
    profile: null,
    motors: null
  })
  
  const supabase = createBrowserClient()

  const runTests = async () => {
    setLoading(true)
    setTestResults({ products: null, profile: null, motors: null })
    
    try {
      console.log("🧪 Iniciando testes de recursão...")
      
      // Test 1: Buscar produtos (onde ocorria a recursão)
      console.log("📦 Testando busca de produtos...")
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('category', ['laminas', 'tintas', 'acessorios', 'motores'])
        .limit(10)

      if (productsError) {
        console.error("❌ Erro ao buscar produtos:", productsError)
        if (productsError.code === '42P17') {
          setTestResults(prev => ({ ...prev, products: false, error: "Recursão ainda detectada em produtos" }))
        } else {
          setTestResults(prev => ({ ...prev, products: false, error: productsError.message }))
        }
      } else {
        console.log("✅ Produtos carregados com sucesso:", productsData?.length || 0, "itens")
        setTestResults(prev => ({ ...prev, products: true }))
      }

      // Test 2: Buscar perfil do usuário
      console.log("👤 Testando busca de perfil...")
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error("❌ Erro ao buscar perfil:", profileError)
          if (profileError.code === '42P17') {
            setTestResults(prev => ({ ...prev, profile: false, error: "Recursão detectada em profiles" }))
          } else {
            setTestResults(prev => ({ ...prev, profile: false }))
          }
        } else {
          console.log("✅ Perfil carregado com sucesso")
          setTestResults(prev => ({ ...prev, profile: true }))
        }
      } else {
        console.log("ℹ️ Usuário não autenticado, pulando teste de perfil")
        setTestResults(prev => ({ ...prev, profile: null }))
      }

      // Test 3: Buscar motores
      console.log("⚙️ Testando busca de motores...")
      const { data: motorsData, error: motorsError } = await supabase
        .from('motor_models')
        .select('*')
        .eq('is_active', true)
        .limit(5)

      if (motorsError) {
        console.error("❌ Erro ao buscar motores:", motorsError)
        setTestResults(prev => ({ ...prev, motors: false }))
      } else {
        console.log("✅ Motores carregados com sucesso:", motorsData?.length || 0, "itens")
        setTestResults(prev => ({ ...prev, motors: true }))
      }

      console.log("🎉 Testes concluídos!")
      
    } catch (error) {
      console.error("💥 Erro crítico nos testes:", error)
      setTestResults(prev => ({ ...prev, error: "Erro crítico nos testes" }))
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return null
    return status ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusText = (status: boolean | null, name: string) => {
    if (status === null) return `${name}: Não testado`
    return status ? `${name}: Sucesso` : `${name}: Falhou`
  }

  return (
    <Card className="border-purple-500">
      <CardHeader>
        <CardTitle className="text-purple-600">🧪 Painel de Testes - Recursão RLS</CardTitle>
        <CardDescription>
          Teste se as correções de recursão estão funcionando corretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(testResults.products)}
            <span className="text-sm">{getStatusText(testResults.products, "Produtos")}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(testResults.profile)}
            <span className="text-sm">{getStatusText(testResults.profile, "Perfil")}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(testResults.motors)}
            <span className="text-sm">{getStatusText(testResults.motors, "Motores")}</span>
          </div>
        </div>

        {testResults.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{testResults.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={runTests} disabled={loading}>
            {loading ? "Testando..." : "Executar Testes"}
          </Button>
          <Button 
            onClick={() => {
              console.clear()
              setTestResults({ products: null, profile: null, motors: null })
            }} 
            variant="outline"
            disabled={loading}
          >
            Limpar Resultados
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Abra o console (F12) para ver logs detalhados</p>
          <p>Código 42P17 = Recursão infinita detectada</p>
        </div>
      </CardContent>
    </Card>
  )
}