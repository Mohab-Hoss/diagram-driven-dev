-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'pharmacist', 'admin', 'system_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    license_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicines table
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_level INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    description TEXT,
    manufacturer TEXT,
    requires_prescription BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    doctor_name TEXT NOT NULL,
    date_issued DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription_items table (medicines in prescriptions)
CREATE TABLE public.prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    dosage TEXT NOT NULL,
    duration TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart table
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, medicine_id)
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    prescription_id UUID REFERENCES public.prescriptions(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_logs table
CREATE TABLE public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
FOR SELECT USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'system_admin')
);

-- RLS Policies for medicines (public read, staff write)
CREATE POLICY "Anyone can view medicines" ON public.medicines
FOR SELECT USING (true);

CREATE POLICY "Staff can manage medicines" ON public.medicines
FOR ALL USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for prescriptions
CREATE POLICY "Customers can view their prescriptions" ON public.prescriptions
FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Staff can view all prescriptions" ON public.prescriptions
FOR SELECT USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Staff can manage prescriptions" ON public.prescriptions
FOR ALL USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for prescription_items
CREATE POLICY "Users can view their prescription items" ON public.prescription_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_id AND p.customer_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage prescription items" ON public.prescription_items
FOR ALL USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for cart_items
CREATE POLICY "Users can manage their cart" ON public.cart_items
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Customers can view their orders" ON public.orders
FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Staff can view all orders" ON public.orders
FOR SELECT USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Staff can update orders" ON public.orders
FOR UPDATE USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for order_items
CREATE POLICY "Users can view their order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert order items" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.customer_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage order items" ON public.order_items
FOR ALL USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for invoices
CREATE POLICY "Users can view their invoices" ON public.invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.customer_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage invoices" ON public.invoices
FOR ALL USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for inventory_logs
CREATE POLICY "Staff can view inventory logs" ON public.inventory_logs
FOR SELECT USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Staff can create inventory logs" ON public.inventory_logs
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for suppliers
CREATE POLICY "Staff can view suppliers" ON public.suppliers
FOR SELECT USING (
  public.has_role(auth.uid(), 'pharmacist') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can manage suppliers" ON public.suppliers
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();