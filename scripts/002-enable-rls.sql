-- Metal Fly - Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

-- PRICING_CONFIGS
CREATE POLICY "Users can view their own pricing config" ON pricing_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pricing config" ON pricing_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pricing config" ON pricing_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pricing config" ON pricing_configs
  FOR DELETE USING (auth.uid() = user_id);

-- CLIENTS
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- ORDERS
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- PRODUCTS (Todos podem ver, apenas admin pode modificar)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can view all products" ON products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

CREATE POLICY "Admin can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

CREATE POLICY "Admin can update products" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

CREATE POLICY "Admin can delete products" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

-- CART_ITEMS
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- STORE_ORDERS
CREATE POLICY "Users can view their own store orders" ON store_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store orders" ON store_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all store orders" ON store_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

CREATE POLICY "Admin can update store orders" ON store_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

-- STORE_ORDER_ITEMS
CREATE POLICY "Users can view their own order items" ON store_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM store_orders WHERE id = store_order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own order items" ON store_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM store_orders WHERE id = store_order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admin can view all order items" ON store_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

-- COURSES (Publicados visíveis para todos autenticados)
CREATE POLICY "Authenticated users can view published courses" ON courses
  FOR SELECT USING (is_published = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can view all courses" ON courses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

CREATE POLICY "Admin can insert courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

CREATE POLICY "Admin can update courses" ON courses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

CREATE POLICY "Admin can delete courses" ON courses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

-- MODULES
CREATE POLICY "Authenticated users can view modules of published courses" ON modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND is_published = true) AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admin can manage modules" ON modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

-- LESSONS
CREATE POLICY "Authenticated users can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.is_published = true
    ) AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admin can manage lessons" ON lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_master')
  );

-- PROGRESS
CREATE POLICY "Users can view their own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON progress
  FOR DELETE USING (auth.uid() = user_id);
