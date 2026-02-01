export type UserRole = 'admin' | 'user' | 'admin_master'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  phone: string | null
  company_name: string | null
  created_at: string
  updated_at: string
}

export interface PricingConfig {
  id: string
  user_id: string
  blade_price_per_m2: number
  painting_price_per_m2: number
  labor_hourly_rate: number
  profit_margin: number
  additional_costs: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string | null
  gate_type: 'sliding' | 'swing' | 'sectional' | 'rolling'
  width: number
  height: number
  material_cost: number
  labor_cost: number
  total_price: number
  status: 'draft' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  client?: Client
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  stock_quantity: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: ProductCategory
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export interface StoreOrder {
  id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  shipping_address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StoreOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
  product?: Product
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  is_free: boolean
  price: number
  created_at: string
  updated_at: string
  modules?: CourseModule[]
}

export interface CourseModule {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  video_url: string | null
  content: string | null
  duration_minutes: number | null
  order_index: number
  is_free: boolean
  created_at: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface CourseEnrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
}

// Calculator types
export interface GateCalculation {
  gateType: 'sliding' | 'swing' | 'sectional' | 'rolling'
  width: number
  height: number
  automationType: 'none' | 'basic' | 'premium'
  materialType: 'iron' | 'aluminum' | 'stainless'
}

export interface CalculationResult {
  materialCost: number
  laborCost: number
  automationCost: number
  subtotal: number
  profitMargin: number
  totalPrice: number
}

// Advertisement types
export type AdvertisementContentType = 'image' | 'video' | 'html'
export type AdvertisementPosition = 'calculator_header_right' | 'calculator_sidebar' | 'calculator_footer' | 'dashboard_sidebar' | 'dashboard_header' | 'store_banner' | 'academy_banner'
export type AdvertisementType = 'store' | 'academy' | 'both'

export interface Advertisement {
  id: string
  title: string
  description: string | null
  content_type: AdvertisementContentType
  image_url: string | null
  video_url: string | null
  html_content: string | null
  position: AdvertisementPosition
  width: string
  height: string
  ad_type: AdvertisementType
  related_category: string | null
  action_url: string | null
  action_text: string
  is_active: boolean
  start_date: string
  end_date: string | null
  display_order: number
  impressions_count: number
  clicks_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AdImpression {
  id: string
  advertisement_id: string
  user_id: string | null
  page_url: string
  ip_address: string | null
  user_agent: string | null
  viewed_at: string
}

export interface AdClick {
  id: string
  advertisement_id: string
  user_id: string | null
  page_url: string
  ip_address: string | null
  user_agent: string | null
  clicked_at: string
}
