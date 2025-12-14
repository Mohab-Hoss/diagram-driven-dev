import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Search, 
  ShoppingCart, 
  Filter,
  Pill,
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import { Medicine } from '@/types';

const categories = [
  'All',
  'Pain Relief',
  'Vitamins',
  'Antibiotics',
  'Digestive Health',
  'Allergy',
  'Diabetes',
  'Cardiovascular',
  'Respiratory'
];

export default function Medicines() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchMedicines();
  }, [selectedCategory]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('medicines')
        .select('*')
        .gt('stock_level', 0)
        .order('name');

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMedicines(data as Medicine[]);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const addToCart = async (medicine: Medicine) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    if (medicine.requires_prescription) {
      toast.error('This medicine requires a prescription');
      return;
    }

    setAddingToCart(medicine.id);
    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('medicine_id', medicine.id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({ user_id: user.id, medicine_id: medicine.id, quantity: 1 });
        
        if (error) throw error;
      }

      toast.success(`${medicine.name} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Medicines</h1>
          <p className="text-muted-foreground">Browse our wide selection of medicines and health products</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Medicines Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No medicines found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedicines.map((medicine, index) => (
              <Card 
                key={medicine.id} 
                className="overflow-hidden shadow-card card-hover animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                  <Pill className="h-16 w-16 text-primary/50" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground line-clamp-1">{medicine.name}</h3>
                    {medicine.requires_prescription && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Rx
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="mb-2">{medicine.category}</Badge>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                    {medicine.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">${medicine.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{medicine.stock_level} in stock</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToCart(medicine)}
                      disabled={addingToCart === medicine.id || medicine.requires_prescription}
                    >
                      {addingToCart === medicine.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
