import { useState } from 'react';
import { Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductShowcase() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const products = [
    {
      id: '1',
      name: 'Elegant Dress',
      description: 'Premium cotton blend',
      price: '45,000 RWF',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '2',
      name: 'Casual Shirt',
      description: '100% organic cotton',
      price: '25,000 RWF',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '3',
      name: 'Designer Bag',
      description: 'Genuine leather',
      price: '65,000 RWF',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    },
    {
      id: '4',
      name: 'Sneakers',
      description: 'Limited edition',
      price: '55,000 RWF',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500'
    }
  ];

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (productId: string) => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', productId);
  };

  return (
    <section id="products" className="py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Imyenda Nziza Cyane
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Featured Fashion Collections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
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
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {product.name}
                </h3>
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

        <div className="text-center mt-12">
          <Button className="gradient-bg text-white px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg">
            Reba Imyenda Yose / View All Products
          </Button>
        </div>
      </div>
    </section>
  );
}
