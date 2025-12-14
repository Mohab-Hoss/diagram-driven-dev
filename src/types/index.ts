export type AppRole = 'customer' | 'pharmacist' | 'admin' | 'system_admin';

export interface User {
  id: string;
  email: string;
  username: string;
  role: AppRole;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  license_no?: string;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_level: number;
  expiry_date?: string;
  description?: string;
  manufacturer?: string;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  medicine_id: string;
  quantity: number;
  created_at: string;
  medicine?: Medicine;
}

export interface Prescription {
  id: string;
  customer_id: string;
  doctor_name: string;
  date_issued: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  dosage: string;
  duration: string;
  quantity: number;
  created_at: string;
  medicine?: Medicine;
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  payment_status: string;
  prescription_id?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  medicine?: Medicine;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  medicine_id: string;
  action: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  performed_by?: string;
  created_at: string;
  medicine?: Medicine;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info?: string;
  email?: string;
  address?: string;
  created_at: string;
}
