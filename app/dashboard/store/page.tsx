"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import type { Product, ProductCategory, CartItem } from "@/lib/types"
import { Loader2, Search, ShoppingCart, Plus, Minus, Package } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const Loading = () => null

export default function StorePage() {
  const { profile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const searchParams = useSearchParams()

  const supabase = createBrowserClient()

  const fetchData = async () => {
    if (!profile) return

    const [productsRes, categoriesRes, cartRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, category:product_categories(*)")
        .eq("is_active", true)
        .order("name"),
      supabase.from("product_categories").select("*").order("name"),
      supabase
        .from("cart_items")
        .select("*, product:products(*)")
        .eq("user_id", profile.id),
    ])

    if (productsRes.data) setProducts(productsRes.data as Product[])
    if (categoriesRes.data) setCategories(categoriesRes.data as ProductCategory[])
    if (cartRes.data) setCartItems(cartRes.data as CartItem[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [profile])

  const addToCart = async (productId: string) => {
    if (!profile) return

    const existingItem = cartItems.find((item) => item.product_id === productId)

    if (existingItem) {
      await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id)
    } else {
      await supabase.from("cart_items").insert({
        user_id: profile.id,
        product_id: productId,
        quantity: 1,
      })
    }

    await fetchData()
  }

  const updateCartQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await supabase.from("cart_items").delete().eq("id", itemId)
    } else {
      await supabase.from("cart_items").update({ quantity }).eq("id", itemId)
    }
    await fetchData()
  }

  const getCartQuantity = (productId: string) => {
    const item = cartItems.find((item) => item.product_id === productId)
    return item?.quantity || 0
  }

  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity
  }, 0)

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      categoryFilter === "all" || product.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <Suspense fallback={<Loading />}>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Loja de Insumos</h1>
              <p className="text-muted-foreground">
                Compre motores, controles e acessorios com precos exclusivos.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/store/cart">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Carrinho
                {cartCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>

          {cartCount > 0 && (
            <Card className="bg-accent/10 border-accent/50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">
                      {cartCount} {cartCount === 1 ? "item" : "itens"} no carrinho
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(cartTotal)}
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/dashboard/store/cart">Finalizar Compra</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tente uma busca diferente ou outra categoria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const cartQty = getCartQuantity(product.id)
                const cartItem = cartItems.find((item) => item.product_id === product.id)

                return (
                  <Card key={product.id} className="overflow-hidden group">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      {product.category && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                      {product.description && (
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(product.price)}
                        </span>
                        {product.stock_quantity > 0 ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Em estoque
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Esgotado
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      {cartQty > 0 ? (
                        <div className="flex items-center justify-between w-full">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateCartQuantity(cartItem!.id, cartQty - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{cartQty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateCartQuantity(cartItem!.id, cartQty + 1)}
                            disabled={product.stock_quantity <= cartQty}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock_quantity === 0}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Adicionar
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Suspense>
  )
}
