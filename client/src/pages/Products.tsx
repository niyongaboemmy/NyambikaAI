import { useState } from 'react';
import { Search, Filter, Heart, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  const categories = [
    { id: 'all', name: 'All', name_rw: 'Byose' },
    { id: 'women', name: 'Women', name_rw: 'Abagore' },
    { id: 'men', name: 'Men', name_rw: 'Abagabo' },
    { id: 'accessories', name: 'Accessories', name_rw: 'Ibikoresho' },
  ];

  const products = [
    {
      id: '1',
      name: 'Elegant Evening Dress',
      name_rw: 'Ikoti Nziza',
      description: 'Premium silk blend with intricate embroidery',
      price: '85,000 RWF',
      category: 'women',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '2',
      name: 'Classic Business Shirt',
      name_rw: 'Ishati ya Kazi',
      description: '100% cotton with wrinkle-free technology',
      price: '35,000 RWF',
      category: 'men',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '3',
      name: 'Luxury Leather Handbag',
      name_rw: 'Agasanduku k\'Ubururu',
      description: 'Handcrafted genuine leather with gold accents',
      price: '120,000 RWF',
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '4',
      name: 'Premium Sneakers',
      name_rw: 'Inkweto za Sport',
      description: 'Limited edition with advanced cushioning',
      price: '75,000 RWF',
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '5',
      name: 'Summer Casual Dress',
      name_rw: 'Ikoti y\'Impeshyi',
      description: 'Lightweight and breathable fabric',
      price: '45,000 RWF',
      category: 'women',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '6',
      name: 'Formal Blazer',
      name_rw: 'Ikoti ya Formal',
      description: 'Tailored fit with premium wool blend',
      price: '95,000 RWF',
      category: 'men',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.name_rw.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (productId: string) => {
    console.log('Adding to cart:', productId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <Header />
      
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              Imyenda Yose / All Products
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover our complete fashion collection
            </p>
          </div>

          {/* Search and Filter */}
          <div className="glassmorphism rounded-2xl p-6 mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Shakisha imyenda... / Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 glassmorphism border-0 bg-transparent"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id ? "gradient-bg text-white" : "glassmorphism"}
                  >
                    {category.name_rw}
                  </Button>
                ))}
              </div>
              
              <Button variant="ghost" className="glassmorphism">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group floating-card p-6 neumorphism">
                <div className="relative overflow-hidden rounded-2xl mb-4">
                  <img 
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(product.id)}
                    className={`absolute top-2 right-2 glassmorphism rounded-full p-2 ${
                      favorites.includes(product.id) 
                        ? 'text-red-500' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.name_rw}
                    </p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[rgb(var(--electric-blue-rgb))]">
                      {product.price}
                    </span>
                    <Button 
                      onClick={() => addToCart(product.id)}
                      className="gradient-bg text-white px-4 py-2 rounded-xl hover:scale-105 transition-all duration-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="glassmorphism rounded-3xl p-12 max-w-md mx-auto">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Nta myenda Yabonetse / No Products Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerageza gushakisha ijambo rishya cyangwa hitamo indi category
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
