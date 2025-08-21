import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

export default function CategoryCards() {
  const categories = [
    {
      id: 'women',
      title: "Imyenda y'Abagore",
      subtitle: "Women's Fashion Collection",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      link: "/products?category=women"
    },
    {
      id: 'men',
      title: "Imyenda y'Abagabo",
      subtitle: "Men's Fashion Collection",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      link: "/products?category=men"
    },
    {
      id: 'accessories',
      title: "Ibikoresho",
      subtitle: "Accessories & More",
      image: "https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      link: "/products?category=accessories"
    }
  ];

  return (
    <section className="py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 gradient-text">
          Hitamo Icyakunze
          <span className="block text-2xl md:text-3xl mt-2 text-gray-600 dark:text-gray-300">Choose Your Style</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category.id} href={category.link}>
              <div className="group floating-card p-8 cursor-pointer neumorphism">
                <img 
                  src={category.image}
                  alt={category.title}
                  className="w-full h-64 object-cover rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {category.subtitle}
                  </p>
                  <div className="flex justify-center items-center space-x-2 text-[rgb(var(--electric-blue-rgb))]">
                    <span className="font-semibold">Reba Byinshi</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
