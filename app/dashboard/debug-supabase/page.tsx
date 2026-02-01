"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugSupabasePage() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  const addTest = (name: string, status: string, details: any = null) => {
    setTests(prev => [...prev, { name, status, details, timestamp: new Date().toISOString() }])
  }

  const runDiagnostics = async () => {
    setTests([])
    setLoading(true)

    try {
      // Test 1: Connection
      addTest("Conexão Supabase", "running")
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        addTest("Conexão Supabase", "failed", sessionError)
      } else {
        addTest("Conexão Supabase", "success", { hasSession: !!session, userId: session?.user?.id })
      }

      // Test 2: Auth User
      if (session?.user) {
        addTest("Usuário Autenticado", "running")
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          addTest("Usuário Autenticado", "failed", userError)
        } else {
          addTest("Usuário Autenticado", "success", { 
            id: user?.id, 
            email: user?.email,
            createdAt: user?.created_at 
          })
        }

        // Test 3: Profiles Table
        addTest("Tabela Profiles", "running")
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
          
          if (error) {
            addTest("Tabela Profiles", "failed", {
              code: error.code,
              message: error.message,
              details: error.details,
              status: (error as any).status
            })
          } else {
            addTest("Tabela Profiles", "success", data)
          }
        } catch (err) {
          addTest("Tabela Profiles", "error", err)
        }

        // Test 4: Pricing Configs Table
        addTest("Tabela Pricing Configs", "running")
        try {
          const { data, error } = await supabase
            .from("pricing_configs")
            .select("*")
            .eq("user_id", session.user.id)
            .single()
          
          if (error) {
            addTest("Tabela Pricing Configs", "failed", {
              code: error.code,
              message: error.message,
              details: error.details
            })
          } else {
            addTest("Tabela Pricing Configs", "success", data)
          }
        } catch (err) {
          addTest("Tabela Pricing Configs", "error", err)
        }

        // Test 5: Table Structure
        addTest("Estrutura das Tabelas", "running")
        try {
          // Check if we can query table metadata
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, full_name, role, created_at, updated_at")
            .limit(1)
          
          const { data: pricingData, error: pricingError } = await supabase
            .from("pricing_configs")
            .select("id, user_id, material_margin, labor_hourly_rate, profit_margin")
            .limit(1)

          addTest("Estrutura das Tabelas", "success", {
            profiles: { 
              accessible: !profileError, 
              columns: profileData && profileData.length > 0 ? Object.keys(profileData[0]) : [],
              error: profileError 
            },
            pricing_configs: { 
              accessible: !pricingError, 
              columns: pricingData && pricingData.length > 0 ? Object.keys(pricingData[0]) : [],
              error: pricingError 
            }
          })
        } catch (err) {
          addTest("Estrutura das Tabelas", "error", err)
        }
      }

    } catch (error) {
      addTest("Erro Geral", "failed", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-green-600 bg-green-50"
      case "failed": return "text-red-600 bg-red-50"
      case "error": return "text-orange-600 bg-orange-50"
      case "running": return "text-blue-600 bg-blue-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico Supabase</CardTitle>
          <CardDescription>
            Ferramenta para debugar problemas de conexão e estrutura do banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? "Executando..." : "Executar Diagnóstico"}
            </Button>
          </div>

          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{test.name}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(test.status)}`}>
                    {test.status === "running" ? "Executando..." : test.status}
                  </span>
                </div>
                
                {test.details && (
                  <div className="mt-2">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded overflow-auto text-xs">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(test.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {tests.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              Clique em "Executar Diagnóstico" para começar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}