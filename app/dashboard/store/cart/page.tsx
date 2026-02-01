"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { CartItem } from "@/lib/types"
import { Loader2, ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Package } from "lucide-react"

export default function CartPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [shippingAddress, setShippingAddress] = useState("")
  const [notes, setNotes] = useState("")

  const supabase = createBrowserClient()

  const fetchCart = async () => {
    if (!profile) return

    const { data } = await supabase
      .from("cart_items")
      .select("*, product:products(*)")
      .eq("user_id", profile.id)

    if (data) setCartItems(data as CartItem[])
    setLoading(false)
  }

  useEffect(() => {
    fetchCart()
  }, [profile])

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await supabase.from("cart_items").delete().eq("id", itemId)
    } else {
      await supabase.from("cart_items").update({ quantity }).eq("id", itemId)
    }
    await fetchCart()
  }

  const removeItem = async (itemId: string) => {
    await supabase.from("cart_items").delete().eq("id", itemId)
    await fetchCart()
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity
  }, 0)

  const handleCheckout = async () => {
    if (!profile || cartItems.length === 0) return
    setProcessing(true)

    // Create store order
    const { data: order, error: orderError } = await supabase
      .from("store_orders")
      .insert({
        user_id: profile.id,
        status: "pending",
        total_amount: subtotal,
        shipping_address: shippingAddress || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      setProcessing(false)
      return
    }

    // Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.product?.price || 0,
    }))

    await supabase.from("store_order_items").insert(orderItems)

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", profile.id)

    setProcessing(false)
    router.push("/dashboard/store/orders")
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/store">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carrinho</h1>
          <p className="text-muted-foreground">
            Revise seus itens antes de finalizar.
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Seu carrinho esta vazio</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione produtos para continuar.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/store">Ver Produtos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="object-cover w-full h-full rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.product?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.product?.price || 0)} cada
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency((item.product?.price || 0) * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive mt-2"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {item.product?.name} x{item.quantity}
                      </span>
                      <span>{formatCurrency((item.product?.price || 0) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados de Entrega</CardTitle>
                <CardDescription>
                  Informe o endereco para entrega.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereco de Entrega</Label>
                  <Textarea
                    id="address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Rua, numero, bairro, cidade..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observacoes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucoes especiais..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={processing || cartItems.length === 0}
                >
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Finalizar Pedido
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
