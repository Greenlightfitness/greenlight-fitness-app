import React, { useState, useEffect } from 'react';
import { getProducts, getPlans, createProduct, updateProduct, deleteProduct, uploadFile, getPublicUrl } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, TrainingPlan, ProductCategory, ProductType } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  Package, Plus, Trash2, Edit, X, Image as ImageIcon, Upload, Loader2,
  ChevronLeft, DollarSign, Tag, FileText, Layers, CheckCircle, 
  AlertCircle, Eye, EyeOff, Link2, Sparkles, Save, Info
} from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

const AdminProducts: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Product> & { selectedPlanIds?: string[] }>({
    title: '',
    description: '',
    longDescription: '',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    planId: '',
    thumbnailUrl: '',
    category: 'GENERAL',
    type: 'PLAN',
    features: [],
    isActive: true,
    selectedPlanIds: []
  });

  const [currentFeature, setCurrentFeature] = useState('');
  const [creatingStripe, setCreatingStripe] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const prodData = await getProducts();
      setProducts(prodData.map((d: any) => ({
        id: d.id,
        coachId: d.coach_id,
        planId: d.plan_id,
        title: d.title,
        description: d.description,
        longDescription: d.long_description,
        features: d.features,
        category: d.category,
        type: d.type,
        price: d.price,
        currency: d.currency,
        interval: d.interval,
        thumbnailUrl: d.thumbnail_url,
        isActive: d.is_active,
      } as Product)));

      const planData = await getPlans();
      setPlans(planData.map((d: any) => ({
        id: d.id,
        coachId: d.coach_id,
        name: d.name,
        description: d.description,
        createdAt: d.created_at,
      } as TrainingPlan)));
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      longDescription: '',
      price: 0,
      currency: 'EUR',
      interval: 'month',
      planId: '',
      thumbnailUrl: '',
      category: 'GENERAL',
      type: 'PLAN',
      features: [],
      isActive: true,
      selectedPlanIds: []
    });
    setCurrentFeature('');
    setEditingProduct(null);
  };

  const handleCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setViewMode('edit');
  };

  const handleBack = () => {
    resetForm();
    setViewMode('list');
  };

  const handleAddFeature = () => {
    if (currentFeature.trim()) {
      setFormData({ ...formData, features: [...(formData.features || []), currentFeature.trim()] });
      setCurrentFeature('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData({ ...formData, features: formData.features?.filter((_, i) => i !== idx) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (!file.type.startsWith('image/')) {
      setError("Bitte wähle eine Bilddatei aus.");
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `products/${user.id}/${Date.now()}_${safeName}`;
      
      await uploadFile('products', storagePath, file);
      const downloadUrl = getPublicUrl('products', storagePath);
      
      setFormData(prev => ({ ...prev, thumbnailUrl: downloadUrl }));
      setSuccess("Bild erfolgreich hochgeladen!");
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(`Upload fehlgeschlagen: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Create product in Stripe
  const createStripeProduct = async (productData: any) => {
    try {
      const response = await fetch('/api/create-stripe-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: productData.title,
          description: productData.description,
          price: productData.price,
          currency: productData.currency,
          interval: productData.interval,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stripe API error');
      }
      
      return await response.json();
    } catch (err: any) {
      console.error('Stripe creation failed:', err);
      return null; // Don't fail the whole operation if Stripe fails
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Du musst eingeloggt sein.");
      return;
    }

    // Validation
    if (!formData.title?.trim()) {
      setError("Bitte gib einen Produktnamen ein.");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError("Bitte gib einen gültigen Preis ein.");
      return;
    }
    if (!formData.selectedPlanIds || formData.selectedPlanIds.length === 0) {
      setError("Bitte wähle mindestens einen Plan aus.");
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      // 1. Try to create in Stripe first (optional - won't fail if Stripe not configured)
      setCreatingStripe(true);
      let stripeData = null;
      if (!editingProduct) {
        stripeData = await createStripeProduct({
          title: formData.title?.trim(),
          description: formData.description?.trim(),
          price: formData.price,
          currency: formData.currency,
          interval: formData.interval,
        });
        if (stripeData) {
          console.log('Stripe product created:', stripeData);
        }
      }
      setCreatingStripe(false);

      // 2. Create/update product in our database
      const payload = {
        coach_id: user.id,
        plan_id: formData.selectedPlanIds[0] || null, // Primary plan for backwards compatibility
        title: formData.title?.trim(),
        description: formData.description?.trim() || '',
        long_description: formData.longDescription?.trim() || '',
        features: formData.features || [],
        category: formData.category || 'GENERAL',
        type: formData.type || 'PLAN',
        price: Number(formData.price),
        currency: formData.currency || 'EUR',
        interval: formData.interval || 'month',
        thumbnail_url: formData.thumbnailUrl || '',
        is_active: formData.isActive ?? true,
        stripe_product_id: stripeData?.stripe_product_id || null,
        stripe_price_id: stripeData?.stripe_price_id || null,
      };
      
      console.log("Saving product with payload:", payload);
      
      let productId: string;
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        productId = editingProduct.id;
        setSuccess("Produkt erfolgreich aktualisiert!");
      } else {
        const newProduct = await createProduct(payload);
        productId = newProduct.id;
        setSuccess(stripeData 
          ? "Produkt erstellt & in Stripe angelegt! ✓" 
          : "Produkt erfolgreich erstellt!");
      }

      // 3. Save product-plan relationships
      await saveProductPlans(productId, formData.selectedPlanIds || []);
      
      await fetchData();
      setTimeout(() => {
        setViewMode('list');
        resetForm();
      }, 1500);
      
    } catch (err: any) {
      console.error("Error saving product:", err);
      setError(`Fehler beim Speichern: ${err.message || 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
      setCreatingStripe(false);
    }
  };

  // Save product-plan relationships
  const saveProductPlans = async (productId: string, planIds: string[]) => {
    const { supabase } = await import('../services/supabase');
    
    // Delete existing relationships
    await supabase.from('product_plans').delete().eq('product_id', productId);
    
    // Insert new relationships
    if (planIds.length > 0) {
      const inserts = planIds.map((planId, index) => ({
        product_id: productId,
        plan_id: planId,
        sort_order: index,
      }));
      
      const { error } = await supabase.from('product_plans').insert(inserts);
      if (error) console.error('Error saving product plans:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Produkt wirklich löschen?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      setSuccess("Produkt gelöscht!");
    } catch (err: any) {
      setError(`Fehler beim Löschen: ${err.message}`);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { is_active: !product.isActive });
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      ));
      setSuccess(product.isActive ? "Produkt deaktiviert" : "Produkt aktiviert");
    } catch (err: any) {
      setError(`Fehler: ${err.message}`);
    }
  };

  // ============ RENDER: PRODUCT LIST ============
  if (viewMode === 'list') {
    return (
      <div className="space-y-8 animate-in fade-in pb-20">
        {/* Notifications */}
        {(error || success) && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border ${
            error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'
          } flex items-center gap-3 animate-in slide-in-from-top`}>
            {error ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span className="font-medium">{error || success}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              Produkte <span className="text-xs bg-[#00FF00]/10 text-[#00FF00] px-2 py-1 rounded border border-[#00FF00]/20">Admin</span>
            </h1>
            <p className="text-zinc-400 mt-2">Verwalte deine Shop-Produkte und Trainingspläne</p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 shadow-lg shadow-[#00FF00]/10">
            <Plus size={20} /> Neues Produkt
          </Button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#00FF00]" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-zinc-500">
            <Package size={64} className="mb-6 text-zinc-700" />
            <p className="text-lg font-medium mb-2">Keine Produkte vorhanden</p>
            <p className="text-sm text-zinc-600 mb-6">Erstelle dein erstes Produkt, um loszulegen</p>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus size={18} /> Produkt erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className={`bg-[#1C1C1E] border rounded-2xl overflow-hidden group transition-all shadow-lg hover:-translate-y-1 ${
                product.isActive ? 'border-zinc-800 hover:border-[#00FF00]/30' : 'border-zinc-800/50 opacity-60'
              }`}>
                <div className="h-40 bg-zinc-900 relative">
                  {product.thumbnailUrl ? (
                    <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-[#00FF00] uppercase">
                      {product.category}
                    </span>
                    {!product.isActive && (
                      <span className="bg-red-500/20 px-2 py-1 rounded text-[10px] font-bold text-red-400 uppercase">
                        Inaktiv
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleToggleActive(product)} 
                      className="bg-black/80 p-2 rounded-lg text-white hover:text-[#00FF00] transition-colors"
                      title={product.isActive ? "Deaktivieren" : "Aktivieren"}
                    >
                      {product.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => handleEdit(product)} className="bg-black/80 p-2 rounded-lg text-white hover:text-[#00FF00] transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="bg-black/80 p-2 rounded-lg text-white hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[#00FF00] font-bold text-xl">{product.price} {product.currency}</span>
                    <span className="text-[9px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded uppercase font-bold">
                      {product.interval === 'onetime' ? 'Einmalig' : `/ ${product.interval}`}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm line-clamp-2">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============ RENDER: CREATE/EDIT FORM ============
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in pb-20">
      {/* Notifications */}
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border ${
          error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'
        } flex items-center gap-3 animate-in slide-in-from-top`}>
          {error ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium">{error || success}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={handleBack} 
          className="p-3 bg-[#1C1C1E] rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {viewMode === 'edit' ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {viewMode === 'edit' ? `Bearbeite "${editingProduct?.title}"` : 'Fülle alle erforderlichen Felder aus'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SECTION 1: Basis-Informationen */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Basis-Informationen</h2>
              <p className="text-xs text-zinc-500">Name, Typ und Kategorie des Produkts</p>
            </div>
          </div>

          <div className="space-y-5">
            <Input 
              label="Produktname *" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="z.B. Iron Protocol - 12 Wochen Programm"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Produkttyp *</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as ProductType})}
                  className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none transition-colors"
                >
                  <option value="PLAN">📋 Trainingsplan</option>
                  <option value="COACHING_1ON1">👤 1:1 Coaching</option>
                  <option value="ADDON">➕ Add-on</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Kategorie *</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                  className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none transition-colors"
                >
                  <option value="GENERAL">🏋️ General Fitness</option>
                  <option value="POLICE">👮 Polizei</option>
                  <option value="MILITARY">🎖️ Militär</option>
                  <option value="FIRE">🚒 Feuerwehr</option>
                  <option value="RECOVERY">💆 Recovery</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Verknüpfte Pläne * <span className="text-zinc-600 normal-case">(Mehrfachauswahl möglich)</span>
              </label>
              {plans.length === 0 ? (
                <p className="text-xs text-amber-400 flex items-center gap-1 py-3">
                  <AlertCircle size={12} /> Erstelle zuerst einen Plan im Planner
                </p>
              ) : (
                <div className="bg-[#121212] border border-zinc-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {plans.map(plan => {
                    const isSelected = formData.selectedPlanIds?.includes(plan.id);
                    return (
                      <label 
                        key={plan.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#00FF00]/10 border border-[#00FF00]/30' 
                            : 'bg-zinc-900/50 border border-transparent hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...(formData.selectedPlanIds || []), plan.id]
                              : formData.selectedPlanIds?.filter(id => id !== plan.id) || [];
                            setFormData({ ...formData, selectedPlanIds: newIds });
                          }}
                          className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-[#00FF00] focus:ring-[#00FF00] focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <span className={`font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                            {plan.name}
                          </span>
                          {plan.description && (
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{plan.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle size={18} className="text-[#00FF00]" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              {formData.selectedPlanIds && formData.selectedPlanIds.length > 0 && (
                <p className="text-xs text-[#00FF00] mt-2">
                  {formData.selectedPlanIds.length} Plan{formData.selectedPlanIds.length > 1 ? 'e' : ''} ausgewählt
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: Preis & Abrechnung */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Preis & Abrechnung</h2>
              <p className="text-xs text-zinc-500">Definiere den Preis und das Abrechnungsintervall</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Preis *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-3.5 focus:border-[#00FF00] outline-none transition-colors"
                  placeholder="99.00"
                />
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Währung</label>
              <select 
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
                className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none transition-colors"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Intervall</label>
              <select 
                value={formData.interval}
                onChange={e => setFormData({...formData, interval: e.target.value as any})}
                className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none transition-colors"
              >
                <option value="onetime">💎 Einmalzahlung</option>
                <option value="month">📅 Monatlich</option>
                <option value="year">📆 Jährlich</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 3: Produktbild */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center">
              <ImageIcon size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Produktbild</h2>
              <p className="text-xs text-zinc-500">Ein ansprechendes Bild erhöht die Conversion</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-zinc-700 bg-[#121212] rounded-xl overflow-hidden">
            {uploading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#00FF00]">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-medium">Bild wird hochgeladen...</span>
              </div>
            ) : formData.thumbnailUrl ? (
              <div className="relative">
                <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-64 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                  className="absolute bottom-4 right-4 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} /> Entfernen
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-16 cursor-pointer hover:bg-zinc-900/50 transition-colors">
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                  <Upload size={28} className="text-zinc-500" />
                </div>
                <span className="text-white font-medium mb-1">Bild hochladen</span>
                <span className="text-xs text-zinc-500">PNG, JPG bis 5MB</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>
        </section>

        {/* SECTION 4: Beschreibungen */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Beschreibungen</h2>
              <p className="text-xs text-zinc-500">Verkaufstext für den Shop</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Kurzbeschreibung</label>
              <textarea 
                className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none h-24 resize-none transition-colors"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Kurze, knackige Beschreibung für die Produktkarte..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Ausführliche Beschreibung (Sales Copy)</label>
              <textarea 
                className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none h-40 resize-none transition-colors"
                value={formData.longDescription}
                onChange={e => setFormData({...formData, longDescription: e.target.value})}
                placeholder="Detaillierte Beschreibung für die Produktdetailseite..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: Features */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Features & Vorteile</h2>
              <p className="text-xs text-zinc-500">Bullet Points für die Verkaufsseite</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <input 
                value={currentFeature}
                onChange={e => setCurrentFeature(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                className="flex-1 bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-[#00FF00] outline-none transition-colors"
                placeholder="z.B. 12 Wochen strukturierter Trainingsplan"
              />
              <button 
                type="button" 
                onClick={handleAddFeature} 
                className="px-5 bg-zinc-800 rounded-xl text-white hover:bg-[#00FF00] hover:text-black font-bold transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            {formData.features && formData.features.length > 0 ? (
              <div className="space-y-2">
                {formData.features.map((feat, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#121212] px-4 py-3 rounded-xl border border-zinc-800 group">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-[#00FF00]" />
                      <span className="text-zinc-300">{feat}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveFeature(i)} 
                      className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm text-center py-4">Noch keine Features hinzugefügt</p>
            )}
          </div>
        </section>

        {/* SECTION 6: Status */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isActive ? 'bg-[#00FF00]/10' : 'bg-zinc-800'}`}>
                {formData.isActive ? <Eye size={20} className="text-[#00FF00]" /> : <EyeOff size={20} className="text-zinc-500" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Sichtbarkeit</h2>
                <p className="text-xs text-zinc-500">
                  {formData.isActive ? 'Produkt ist im Shop sichtbar' : 'Produkt ist versteckt'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, isActive: !formData.isActive})}
              className={`relative w-14 h-8 rounded-full transition-colors ${formData.isActive ? 'bg-[#00FF00]' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${formData.isActive ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2 px-8">
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save size={18} />
                {viewMode === 'edit' ? 'Änderungen speichern' : 'Produkt erstellen'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminProducts;
