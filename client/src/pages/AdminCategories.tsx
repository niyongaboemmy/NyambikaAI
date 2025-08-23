import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Plus, Edit3, Trash2, ArrowLeft, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLoginPrompt } from '@/contexts/LoginPromptContext';

interface Category {
  id: string;
  name: string;
  nameRw: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export default function AdminCategories() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { open } = useLoginPrompt();

  // Protect admin route: open login modal if not authenticated, redirect home if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      open();
    } else if (user?.role !== 'admin') {
      setLocation('/');
    }
  }, [isAuthenticated, user, open, setLocation]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  // List categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      return res.json();
    },
  });

  // Form state
  const [editing, setEditing] = useState<null | Category>(null);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nameRw: '',
    description: '',
    imageUrl: '',
  });

  const resetForm = () => {
    setForm({ name: '', nameRw: '', description: '', imageUrl: '' });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      nameRw: cat.nameRw || '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
    });
    setOpenForm(true);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Create
  const createMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to create category');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Category created' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setOpenForm(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Create failed', description: e.message, variant: 'destructive' }),
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/categories/${editing!.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update category');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Category updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setOpenForm(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      toast({ title: 'Category deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (e: any) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.nameRw) {
      toast({ title: 'Missing required fields', description: 'Name and Name (Kinyarwanda) are required', variant: 'destructive' });
      return;
    }
    if (editing) updateMutation.mutate(); else createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">Categories</h1>
              <p className="text-muted-foreground mt-1">Manage product categories and translations</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLocation('/admin-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={openCreate} className="gradient-bg text-white">
                <Plus className="h-4 w-4 mr-2" /> New Category
              </Button>
            </div>
          </div>

          {/* List */}
          <Card className="floating-card">
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-muted-foreground">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">No categories yet</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="glassmorphism rounded-xl p-4 flex gap-3">
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{cat.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{cat.nameRw}</div>
                        {cat.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>
                            <Edit3 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(cat.id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Modal - simple inline card */}
          {openForm && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="w-full max-w-xl">
                <Card className="floating-card">
                  <CardHeader>
                    <CardTitle>{editing ? 'Edit Category' : 'New Category'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name (English) *</Label>
                          <Input id="name" name="name" value={form.name} onChange={onChange} className="glassmorphism border-0" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nameRw">Name (Kinyarwanda) *</Label>
                          <Input id="nameRw" name="nameRw" value={form.nameRw} onChange={onChange} className="glassmorphism border-0" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={form.description} onChange={onChange} rows={3} className="glassmorphism border-0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input id="imageUrl" name="imageUrl" value={form.imageUrl} onChange={onChange} className="glassmorphism border-0" />
                      </div>
                      {form.imageUrl && (
                        <div className="border rounded-lg p-3 glassmorphism">
                          <img src={form.imageUrl} alt="preview" className="h-28 w-28 object-cover rounded" />
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" className="gradient-bg text-white" disabled={createMutation.isPending || updateMutation.isPending}>
                          {editing ? 'Save Changes' : 'Create Category'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setOpenForm(false); resetForm(); }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
