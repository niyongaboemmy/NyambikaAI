import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function FloatingActionButton() {
  return (
    <Link href="/try-on">
      <Button className="fixed bottom-8 right-8 w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 z-40 animate-pulse-slow">
        <Camera className="h-6 w-6" />
      </Button>
    </Link>
  );
}
