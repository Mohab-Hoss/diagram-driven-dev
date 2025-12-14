import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  Pill, 
  Shield, 
  Clock, 
  Truck, 
  Search,
  ArrowRight,
  Heart,
  Stethoscope,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: Pill,
    title: 'Wide Selection',
    description: 'Access thousands of medicines and health products from trusted manufacturers'
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'All prescriptions verified by licensed pharmacists before dispensing'
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round-the-clock pharmacist assistance for your health queries'
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Quick and reliable delivery right to your doorstep'
  }
];

const categories = [
  { name: 'Pain Relief', icon: Heart, color: 'bg-rose-100 text-rose-600' },
  { name: 'Vitamins', icon: Activity, color: 'bg-amber-100 text-amber-600' },
  { name: 'Antibiotics', icon: Shield, color: 'bg-blue-100 text-blue-600' },
  { name: 'Cardiovascular', icon: Stethoscope, color: 'bg-purple-100 text-purple-600' },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
              <Pill className="h-4 w-4" />
              Your Trusted Pharmacy Partner
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              Healthcare Made{' '}
              <span className="text-primary">Simple</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Order medicines online, manage prescriptions, and get them delivered to your doorstep. 
              Experience modern healthcare with PharmaCare.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/medicines">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  <Search className="h-5 w-5" />
                  Browse Medicines
                </Button>
              </Link>
              {!user && (
                <Link to="/auth">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-foreground">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Link 
                key={category.name} 
                to={`/medicines?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div 
                  className="bg-card rounded-2xl p-6 text-center shadow-card card-hover animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex p-4 rounded-2xl ${category.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Why Choose PharmaCare?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to making healthcare accessible, affordable, and convenient for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-card rounded-2xl p-6 shadow-card card-hover animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-accent inline-flex mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="gradient-hero rounded-3xl p-8 md:p-12 text-center shadow-elevated">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              Join thousands of customers who trust PharmaCare for their healthcare needs.
            </p>
            <Link to={user ? '/medicines' : '/auth'}>
              <Button variant="secondary" size="lg">
                {user ? 'Browse Medicines' : 'Create Account'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
