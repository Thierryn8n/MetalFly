"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  blade_price_per_m2: z.coerce.number().min(0, "O valor deve ser positivo"),
  painting_price_per_m2: z.coerce.number().min(0, "O valor deve ser positivo"),
  labor_hourly_rate: z.coerce.number().min(0, "O valor deve ser positivo"),
  profit_margin: z.coerce.number().min(0, "A margem deve ser positiva"),
  additional_costs: z.coerce.number().min(0, "O valor deve ser positivo"),
})

interface InitialConfigFormProps {
  userId: string
  onConfigComplete: () => void
}

export function InitialConfigForm({ userId, onConfigComplete }: InitialConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createBrowserClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blade_price_per_m2: 180,
      painting_price_per_m2: 65,
      labor_hourly_rate: 80,
      profit_margin: 25,
      additional_costs: 340,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("pricing_configs").upsert({
        user_id: userId,
        blade_price_per_m2: values.blade_price_per_m2,
        painting_price_per_m2: values.painting_price_per_m2,
        labor_hourly_rate: values.labor_hourly_rate,
        profit_margin: values.profit_margin,
        additional_costs: values.additional_costs,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      toast.success("Configurações salvas com sucesso!")
      onConfigComplete()
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast.error("Erro ao salvar configurações. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configuração Inicial de Preços</CardTitle>
        <CardDescription>
          Defina os valores base para os seus orçamentos. Você poderá alterá-los depois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="blade_price_per_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço da Lâmina (R$/m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Custo do metro quadrado da lâmina.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="painting_price_per_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço da Pintura (R$/m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Custo da pintura por metro quadrado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labor_hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mão de Obra (R$/h)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Valor da sua hora de trabalho.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profit_margin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margem de Lucro (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Porcentagem de lucro sobre o custo total.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additional_costs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custos Adicionais (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Outros custos fixos por projeto (frete, etc).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar e Continuar"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
