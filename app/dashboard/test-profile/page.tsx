"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function TestProfilePage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  const runTest = async () => {
    setLoading(true)
    setStatus(null)
    
    try {
      // 1. Check Session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setStatus({ step: "session", error: sessionError })
        setLoading(false)
        return
      }
      
      if (!session) {
        setStatus({ step: "session", error: "No session found" })
        setLoading(false)
        return
      }

      const userId = session.user.id
      
      // 2. Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
        
      if (profileError) {
        setStatus({ 
          step: "profile_fetch", 
          error: profileError, 
          errorCode: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
          message: profileError.message
        })
        setLoading(false)
        return
      }

      setStatus({ 
        step: "success", 
        data: {
            user: { id: session.user.id, email: session.user.email },
            profile: profile
        }
      })
      
    } catch (e: any) {
      setStatus({ step: "exception", error: e.message || e })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Diagnostico de Perfil</h1>
      <Button onClick={runTest} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Executar Teste
      </Button>

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado: {status.step === 'success' ? 'Sucesso' : 'Erro'}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(status, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
