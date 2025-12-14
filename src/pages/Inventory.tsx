import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Search, Package, AlertTriangle, Loader2, Plus, Minus } from 'lucide-react';
import { Medicine } from '@/types';

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (role !== 'pharmacist' && role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchMedicines();
  }, [user, role, navigate]);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase.from('medicines').select('*').order('name');
      if (error) throw error;
      setMedicines(data as Medicine[]);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id: string, change: number) => {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;
    const newStock = Math.max(0, medicine.stock_level + change);
    
    try {
      await supabase.from('medicines').update({ stock_level: newStock }).eq('id', id);
      setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock_level: newStock } : m));
      toast.success('Stock updated');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const filtered = medicines.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Inventory Management</h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search medicines..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="grid gap-4">
          {filtered.map(medicine => (
            <Card key={medicine.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Package className="h-8 w-8 text-primary/50" />
                  <div>
                    <h3 className="font-semibold">{medicine.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">{medicine.category}</Badge>
                      {medicine.stock_level < 20 && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">{medicine.stock_level}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={() => updateStock(medicine.id, -10)}><Minus className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => updateStock(medicine.id, 10)}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
