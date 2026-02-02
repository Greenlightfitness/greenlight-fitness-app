import React, { useState, useEffect } from 'react';
import { supabase, getProducts, getAssignedPlans, getWeeksByPlan, getSessionsByWeek, createAssignedPlan, createAppointment } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, AssignedPlan, TrainingWeek, TrainingSession, TrainingPlan, ProductCategory, ProductType, Appointment } from '../types';
import Button from '../components/Button';
import { ShoppingBag, Check, ShieldCheck, Lock, Unlock, ArrowRight, X, Calendar, Phone } from 'lucide-react';

const CATEGORIES: { id: ProductCategory | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'POLICE', label: 'Police' },
    { id: 'MILITARY', label: 'Military' },
    { id: 'FIRE', label: 'Fire' },
    { id: 'GENERAL', label: 'General' },
    { id: 'RECOVERY', label: 'Recovery' },
];

const Shop: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [ownedPlanIds, setOwnedPlanIds] = useState<Set<string>>(new Set());
  
  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    if(user) {
        fetchProducts();
        fetchOwnedPlans();
    }
  }, [user]);

  const fetchOwnedPlans = async () => {
      if(!user) return;
      try {
          const data = await getAssignedPlans(user.id);
          const owned = new Set<string>();
          data.forEach((d: any) => {
              if (d.original_plan_id) owned.add(d.original_plan_id);
          });
          setOwnedPlanIds(owned);
      } catch (error) {
          console.error("Error fetching owned plans", error);
      }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(undefined, true); // activeOnly = true
      setProducts(data.map((d: any) => ({
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
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Stripe Checkout starten
  const startStripeCheckout = async (product: Product) => {
    if (!user) return;
    setPurchasing(product.id);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          price: product.price,
          currency: product.currency || 'eur',
          interval: product.interval,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/shop?success=true&product=${product.id}`,
          cancelUrl: `${window.location.origin}/shop?canceled=true`,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        // Redirect zu Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (error) {
      console.error("Stripe checkout failed:", error);
      alert("Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.");
      setPurchasing(null);
    }
  };

  // Nach erfolgreicher Zahlung: Plan zuweisen
  const handlePurchaseSuccess = async (product: Product) => {
    if (!user) return;
    setPurchasing(product.id);
    
    try {
        const planId = product.planId;
        const weeksRaw = await getWeeksByPlan(planId);
        
        const weeksData = await Promise.all(weeksRaw.map(async (w: any) => {
            const sessionsRaw = await getSessionsByWeek(w.id);
            const sessions = sessionsRaw.map((s: any) => ({
              id: s.id,
              weekId: s.week_id,
              dayOfWeek: s.day_of_week,
              title: s.title,
              description: s.description,
              order: s.order,
              workoutData: s.workout_data,
            })).sort((a: any, b: any) => a.order - b.order);
            return {
              id: w.id,
              planId: w.plan_id,
              order: w.order,
              focus: w.focus,
              sessions: sessions
            };
        }));

        await createAssignedPlan({
            athlete_id: user.id,
            coach_id: product.coachId,
            original_plan_id: planId,
            start_date: new Date().toISOString().split('T')[0],
            plan_name: product.title,
            description: product.description,
            assignment_type: 'GROUP_FLEX', 
            schedule_status: 'PENDING', 
            schedule: {},
            structure: { weeks: weeksData }
        });

        alert("Kauf erfolgreich! Gehe zu deinem Hub, um deinen Trainingsplan einzurichten.");
        setSelectedProduct(null);
        fetchOwnedPlans();
        
    } catch (error) {
        console.error("Plan assignment failed:", error);
        alert("Fehler beim Zuweisen des Plans. Bitte kontaktiere den Support.");
    } finally {
        setPurchasing(null);
    }
  };

  // Legacy: Direkter Kauf ohne Stripe (für Tests)
  const handlePurchase = async (product: Product) => {
    // Nutze Stripe Checkout
    await startStripeCheckout(product);
  };

  // Check for success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const productId = params.get('product');
    
    if (success === 'true' && productId) {
      // Finde das Produkt und weise den Plan zu
      const product = products.find(p => p.id === productId);
      if (product && !ownedPlanIds.has(product.planId)) {
        handlePurchaseSuccess(product);
      }
      // URL bereinigen
      window.history.replaceState({}, '', '/shop');
    }
    
    if (params.get('canceled') === 'true') {
      alert("Zahlung abgebrochen.");
      window.history.replaceState({}, '', '/shop');
    }
  }, [products, ownedPlanIds]);

  const handleBookAppointment = async () => {
      if(!user || !selectedProduct || !selectedDate || !selectedTime) return;
      setPurchasing('booking');
      
      try {
          await createAppointment({
              athlete_id: user.id,
              athlete_name: user.email || 'Athlete',
              coach_id: selectedProduct.coachId,
              date: selectedDate,
              time: selectedTime,
              status: 'PENDING',
              type: 'CONSULTATION',
          });
          
          alert("Appointment request sent! Your coach will confirm shortly.");
          setSelectedProduct(null);
          setBookingMode(false);
      } catch (error) {
          console.error("Booking failed:", error);
          alert("Booking failed.");
      } finally {
          setPurchasing(null);
      }
  };

  const filteredProducts = products.filter(p => activeCategory === 'ALL' || p.category === activeCategory);

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      
      {/* Category Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md pt-4 pb-2 -mx-6 px-6 border-b border-zinc-800">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">
             Shop <span className="text-[#00FF00]">.</span>
          </h1>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        activeCategory === cat.id 
                        ? 'bg-[#00FF00] text-black shadow-[0_0_10px_rgba(0,255,0,0.4)]' 
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'
                    }`}
                  >
                      {cat.label}
                  </button>
              ))}
          </div>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-center py-20">{t('common.loading')}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-32 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('products.noProducts')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {filteredProducts.map(product => {
             const isOwned = ownedPlanIds.has(product.planId);
             const isCoaching = product.type === 'COACHING_1ON1';

             return (
             <div 
                key={product.id} 
                onClick={() => { setSelectedProduct(product); setBookingMode(false); }}
                className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col hover:border-[#00FF00]/50 transition-all shadow-xl hover:-translate-y-1 duration-300 group cursor-pointer relative"
             >
                {isOwned && (
                    <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-[#00FF00] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border border-[#00FF00]/30 shadow-lg">
                        <Unlock size={12} /> Owned
                    </div>
                )}
                
                <div className="h-48 bg-zinc-800 relative overflow-hidden">
                    {product.thumbnailUrl ? (
                         <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900">
                             <ShoppingBag size={48} />
                        </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#1C1C1E] to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-black/80 text-white font-bold px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                        {product.price} {product.currency}
                    </div>
                </div>
                
                <div className="p-6 pt-0 flex-1 flex flex-col relative">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${isCoaching ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                            {isCoaching ? '1:1 Coaching' : product.interval}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{product.title}</h3>
                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                    
                    <div className="mt-4 flex items-center text-[#00FF00] text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                        View Details <ArrowRight size={16} />
                    </div>
                </div>
             </div>
           )})}
        </div>
      )}

      {/* SALES PAGE MODAL */}
      {selectedProduct && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
              {/* Modal Header */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                  <button onClick={() => setSelectedProduct(null)} className="p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-white/20 transition-colors">
                      <X size={24} />
                  </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                  {/* Hero Image */}
                  <div className="h-[40vh] w-full relative">
                      {selectedProduct.thumbnailUrl ? (
                          <img src={selectedProduct.thumbnailUrl} className="w-full h-full object-cover" alt="Hero" />
                      ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><ShoppingBag size={64} className="text-zinc-700"/></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                          <span className="text-[#00FF00] font-bold tracking-widest uppercase text-xs mb-2 block">{selectedProduct.category}</span>
                          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight shadow-black drop-shadow-lg">{selectedProduct.title}</h2>
                      </div>
                  </div>

                  {/* Booking Flow */}
                  {bookingMode ? (
                      <div className="p-6 max-w-lg mx-auto">
                          <h3 className="text-2xl font-bold text-white mb-2">Book Consultation</h3>
                          <p className="text-zinc-400 mb-6">Choose a time for your free initial strategy call.</p>
                          
                          <div className="space-y-4">
                              <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase text-zinc-500">Date</label>
                                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white w-full focus:border-[#00FF00] outline-none" />
                              </div>
                              <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase text-zinc-500">Time</label>
                                  <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white w-full focus:border-[#00FF00] outline-none">
                                      <option value="">Select Time</option>
                                      <option value="09:00">09:00</option>
                                      <option value="10:00">10:00</option>
                                      <option value="11:00">11:00</option>
                                      <option value="14:00">14:00</option>
                                      <option value="15:00">15:00</option>
                                      <option value="16:00">16:00</option>
                                  </select>
                              </div>
                              <Button onClick={handleBookAppointment} disabled={!selectedDate || !selectedTime || purchasing === 'booking'} fullWidth className="mt-4">
                                  {purchasing === 'booking' ? "Booking..." : "Confirm Booking"}
                              </Button>
                              <button onClick={() => setBookingMode(false)} className="w-full text-center text-zinc-500 py-4 hover:text-white">Cancel</button>
                          </div>
                      </div>
                  ) : (
                      /* Sales Content */
                      <div className="p-6 max-w-3xl mx-auto space-y-8 pb-32">
                          {/* Short Desc */}
                          <p className="text-xl text-zinc-300 font-medium leading-relaxed">
                              {selectedProduct.description}
                          </p>

                          {/* Features */}
                          {selectedProduct.features && selectedProduct.features.length > 0 && (
                              <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-3xl">
                                  <h3 className="text-lg font-bold text-white mb-4">What's Included</h3>
                                  <ul className="space-y-4">
                                      {selectedProduct.features.map((feature, idx) => (
                                          <li key={idx} className="flex items-start gap-3">
                                              <div className="mt-1 bg-[#00FF00] rounded-full p-1 shrink-0">
                                                  <Check size={12} className="text-black" />
                                              </div>
                                              <span className="text-zinc-300">{feature}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}

                          {/* Long Desc */}
                          {selectedProduct.longDescription && (
                              <div className="prose prose-invert prose-green max-w-none">
                                  <h3 className="text-lg font-bold text-white mb-2">Details</h3>
                                  <div className="text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                      {selectedProduct.longDescription}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {/* Sticky Footer Action */}
              {!bookingMode && (
                  <div className="p-4 border-t border-zinc-800 bg-[#1C1C1E]/90 backdrop-blur safe-area-bottom">
                      <div className="max-w-3xl mx-auto flex gap-4">
                          {selectedProduct.type === 'COACHING_1ON1' && (
                              <Button 
                                  onClick={() => setBookingMode(true)} 
                                  variant="secondary"
                                  className="flex-1 border-zinc-700"
                              >
                                  <Phone size={18} className="mr-2" /> Book Call
                              </Button>
                          )}
                          
                          {ownedPlanIds.has(selectedProduct.planId) ? (
                              <Button disabled fullWidth className="opacity-50 cursor-not-allowed">
                                  Already Owned
                              </Button>
                          ) : (
                              <Button 
                                  onClick={() => handlePurchase(selectedProduct)} 
                                  disabled={!!purchasing} 
                                  fullWidth={selectedProduct.type !== 'COACHING_1ON1'}
                                  className="flex-1 shadow-[0_0_20px_rgba(0,255,0,0.3)]"
                              >
                                  {purchasing === selectedProduct.id ? "Processing..." : `Get Access • ${selectedProduct.price} ${selectedProduct.currency}`}
                              </Button>
                          )}
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default Shop;