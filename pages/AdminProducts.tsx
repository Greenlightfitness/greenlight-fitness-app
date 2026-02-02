import React, { useState, useEffect } from 'react';
import { supabase, getProducts, getPlans, createProduct, updateProduct, deleteProduct, uploadFile, getPublicUrl } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, TrainingPlan, ProductCategory, ProductType } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { Package, Plus, Trash2, Edit, X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';

const AdminProducts: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Upload State
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    longDescription: '',
    price: 0,
    currency: 'USD',
    interval: 'month',
    planId: '',
    thumbnailUrl: '',
    category: 'GENERAL',
    type: 'PLAN',
    features: [],
    isActive: true
  });

  const [currentFeature, setCurrentFeature] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // ADMIN VIEW: Fetch ALL products
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

      // Fetch all plans to link
      const planData = await getPlans();
      setPlans(planData.map((d: any) => ({
        id: d.id,
        coachId: d.coach_id,
        name: d.name,
        description: d.description,
        createdAt: d.created_at,
      } as TrainingPlan)));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        title: '',
        description: '',
        longDescription: '',
        price: 0,
        currency: 'USD',
        interval: 'month',
        planId: '',
        thumbnailUrl: '',
        category: 'GENERAL',
        type: 'PLAN',
        features: [],
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
      if(currentFeature.trim()) {
          setFormData({ ...formData, features: [...(formData.features || []), currentFeature] });
          setCurrentFeature('');
      }
  };

  const handleRemoveFeature = (idx: number) => {
      setFormData({ ...formData, features: formData.features?.filter((_, i) => i !== idx) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert("Please upload an image file.");
        return;
    }

    if (!user) {
        alert("You must be logged in to upload.");
        return;
    }

    setUploading(true);
    try {
        console.log("Starting upload...");
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `products/${user.id}/${Date.now()}_${safeName}`;
        
        await uploadFile('products', storagePath, file);
        const downloadUrl = getPublicUrl('products', storagePath);
        console.log("Download URL:", downloadUrl);
        
        setFormData(prev => ({ ...prev, thumbnailUrl: downloadUrl }));
    } catch (error: any) {
        console.error("Upload failed detail:", error);
        alert(`Image upload failed: ${error.message}`);
    } finally {
        setUploading(false);
        e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const payload = {
        coach_id: user.id,
        plan_id: formData.planId,
        title: formData.title,
        description: formData.description,
        long_description: formData.longDescription,
        features: formData.features,
        category: formData.category,
        type: formData.type,
        price: formData.price,
        currency: formData.currency,
        interval: formData.interval,
        thumbnail_url: formData.thumbnailUrl,
        is_active: formData.isActive,
      };
      
      if (editingProduct) {
         await updateProduct(editingProduct.id, payload);
      } else {
         await createProduct(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
             {t('products.title')} <span className="text-xs bg-[#00FF00]/10 text-[#00FF00] px-2 py-1 rounded border border-[#00FF00]/20">Global Admin</span>
           </h1>
           <p className="text-zinc-400 mt-2">Manage the global shop inventory.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2 shadow-lg shadow-[#00FF00]/10">
           <Plus size={20} /> {t('products.create')}
        </Button>
      </div>

      {loading ? (
        <div className="text-zinc-500">{t('common.loading')}</div>
      ) : products.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-zinc-500">
           <Package size={64} className="mb-6 text-zinc-800" />
           <p>{t('products.noProducts')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {products.map(product => (
             <div key={product.id} className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl overflow-hidden group hover:border-[#00FF00]/30 transition-all shadow-lg hover:-translate-y-1">
                <div className="h-40 bg-zinc-800 relative">
                  {product.thumbnailUrl ? (
                      <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <ImageIcon size={32} />
                      </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded text-xs font-bold text-[#00FF00]">
                      {product.category}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                     <button onClick={() => handleOpenModal(product)} className="bg-black/70 p-2 rounded-lg text-white hover:text-[#00FF00] backdrop-blur-sm transition-colors"><Edit size={16} /></button>
                     <button onClick={() => handleDelete(product.id)} className="bg-black/70 p-2 rounded-lg text-white hover:text-red-500 backdrop-blur-sm transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="p-6">
                   <h3 className="text-xl font-bold text-white mb-2">{product.title}</h3>
                   <div className="flex items-center gap-3 mb-4">
                      <span className="text-[#00FF00] font-bold text-lg">{product.price} {product.currency}</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md uppercase font-bold tracking-wider">{product.interval}</span>
                   </div>
                   <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                </div>
             </div>
           ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
           <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative my-8">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-white mb-8">{editingProduct ? t('common.edit') : t('products.create')}</h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                 {/* Basic Info */}
                 <Input label={t('products.productName')} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Type</label>
                        <select 
                           value={formData.type} 
                           onChange={e => setFormData({...formData, type: e.target.value as ProductType})}
                           className="bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none"
                        >
                           <option value="PLAN">Plan</option>
                           <option value="COACHING_1ON1">1:1 Coaching</option>
                           <option value="ADDON">Add-on</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                        <select 
                           value={formData.category} 
                           onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                           className="bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none"
                        >
                           <option value="GENERAL">General</option>
                           <option value="POLICE">Police</option>
                           <option value="MILITARY">Military</option>
                           <option value="FIRE">Fire</option>
                           <option value="RECOVERY">Recovery</option>
                        </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <Input label={t('products.price')} type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('products.interval')}</label>
                        <select 
                           value={formData.interval} 
                           onChange={e => setFormData({...formData, interval: e.target.value as any})}
                           className="bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none"
                        >
                           <option value="onetime">{t('products.onetime')}</option>
                           <option value="month">{t('products.month')}</option>
                           <option value="year">{t('products.year')}</option>
                        </select>
                    </div>
                 </div>

                 <div className="flex flex-col gap-2">
                     <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('products.linkedPlan')}</label>
                     <select 
                        value={formData.planId}
                        onChange={e => setFormData({...formData, planId: e.target.value})}
                        required
                        className="bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3.5 focus:border-[#00FF00] outline-none"
                     >
                        <option value="">{t('products.selectPlan')}</option>
                        {plans.map(p => (
                           <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                     </select>
                 </div>

                 {/* Image Upload Section */}
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('products.image')}</label>
                    <div className="border border-dashed border-zinc-700 bg-[#121212] rounded-xl p-4 flex flex-col items-center justify-center relative">
                        {uploading ? (
                            <div className="flex items-center gap-2 text-[#00FF00]">
                                <Loader2 size={20} className="animate-spin" /> Uploading...
                            </div>
                        ) : formData.thumbnailUrl ? (
                            <div className="relative w-full">
                                <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                                    className="absolute top-2 right-2 bg-black/70 p-2 rounded-full text-white hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full py-8 text-zinc-500 hover:text-white transition-colors">
                                <Upload size={32} />
                                <span className="text-sm font-medium">Click to upload image</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        )}
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Short Description</label>
                    <textarea 
                       className="w-full bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none h-20 placeholder-zinc-700"
                       value={formData.description}
                       onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>

                 {/* Sales Page Details */}
                 <div className="border-t border-zinc-800 pt-6">
                     <h4 className="text-white font-bold mb-4">Sales Page Details</h4>
                     
                     <div className="mb-4">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Long Description (Sales Copy)</label>
                        <textarea 
                           className="w-full bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none h-32 placeholder-zinc-700"
                           value={formData.longDescription}
                           onChange={e => setFormData({...formData, longDescription: e.target.value})}
                        />
                     </div>

                     <div className="mb-4">
                         <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Features (Bullet Points)</label>
                         <div className="flex gap-2 mb-2">
                             <input 
                                value={currentFeature}
                                onChange={e => setCurrentFeature(e.target.value)}
                                className="flex-1 bg-[#121212] rounded-xl px-4 py-2 text-white border border-transparent focus:border-[#00FF00] outline-none"
                                placeholder="e.g. 24/7 Support"
                             />
                             <button type="button" onClick={handleAddFeature} className="bg-zinc-800 px-4 rounded-xl text-white hover:bg-[#00FF00] hover:text-black font-bold">+</button>
                         </div>
                         <div className="space-y-2">
                             {formData.features?.map((feat, i) => (
                                 <div key={i} className="flex justify-between items-center bg-[#121212] px-3 py-2 rounded-lg">
                                     <span className="text-sm text-zinc-300">{feat}</span>
                                     <button type="button" onClick={() => handleRemoveFeature(i)} className="text-zinc-600 hover:text-red-500"><X size={14}/></button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>

                 <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit">{t('common.save')}</Button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;