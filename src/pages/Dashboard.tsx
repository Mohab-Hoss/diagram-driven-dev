import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  Loader2,
  TrendingUp,
  ShoppingCart,
  Pill
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingOrders: number;
  totalMedicines: number;
  expiringMedicines: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (role !== 'pharmacist' && role !== 'admin' && role !== 'system_admin') {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, role, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*');

      // Fetch medicines
      const { data: medicines } = await supabase
        .from('medicines')
        .select('*');

      // Recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('*, order_items(*, medicines(*))')
        .order('created_at', { ascending: false })
        .limit(5);

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const lowStockItems = medicines?.filter(m => m.stock_level < 20).length || 0;
      
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringMedicines = medicines?.filter(m => {
        if (!m.expiry_date) return false;
        const expiryDate = new Date(m.expiry_date);
        return expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue,
        lowStockItems,
        pendingOrders,
        totalMedicines: medicines?.length || 0,
        expiringMedicines
      });

      setRecentOrders(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600',
      change: '+12%'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
      change: '+8%'
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-600',
      change: 'Needs attention'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Package,
      color: 'bg-purple-100 text-purple-600',
      change: 'To process'
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your pharmacy.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium text-foreground">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${order.total_amount.toFixed(2)}</p>
                        <p className={`text-xs capitalize ${
                          order.status === 'confirmed' ? 'text-success' : 
                          order.status === 'pending' ? 'text-warning' : 'text-muted-foreground'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Inventory Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-foreground">Total Medicines</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats?.totalMedicines}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-foreground">Low Stock Alerts</span>
                  </div>
                  <span className="font-semibold text-amber-600">{stats?.lowStockItems}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-100">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <span className="text-foreground">Expiring Soon</span>
                  </div>
                  <span className="font-semibold text-rose-600">{stats?.expiringMedicines}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
