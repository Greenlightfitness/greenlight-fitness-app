import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getProducts, getAssignedPlans, getWeeksByPlan, getSessionsByWeek, createAssignedPlan, createAppointment, getUserPurchases, getCoachingApproval, createCoachingApproval, createCoachingRelationship, getAppointments, createNotification, createPurchaseConfirmation } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, AssignedPlan, TrainingWeek, TrainingSession, TrainingPlan, ProductCategory, ProductType, Appointment, CoachingApproval } from '../types';
import Button from '../components/Button';
import BookingWidget from '../components/BookingWidget';
import { ShoppingBag, Check, ShieldCheck, Lock, Unlock, ArrowRight, X, Calendar, Phone, Clock, CheckCircle2 } from 'lucide-react';

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
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [ownedPlanIds, setOwnedPlanIds] = useState<Set<string>>(new Set());
  const [purchasedProductIds, setPurchasedProductIds] = useState<Set<string>>(new Set());
  const [activeSubscriptionIds, setActiveSubscriptionIds] = useState<Set<string>>(new Set());
  const [stripeDataLoaded, setStripeDataLoaded] = useState(false);
  
  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Coaching Approval State
  const [coachingApprovals, setCoachingApprovals] = useState<Map<string, CoachingApproval>>(new Map());
  const [pendingConsultations, setPendingConsultations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if(user) {
        fetchProducts();
        fetchOwnedPlans();
        fetchPurchases();
        fetchCoachingApprovals();
    }
  }, [user]);

  const fetchCoachingApprovals = async () => {
    if (!user) return;
    try {
      // Fetch all products that require consultation and check approval status
      const productsData = await getProducts(undefined, true);
      const coachingProducts = productsData.filter((p: any) => p.requires_consultation || p.type === 'COACHING_1ON1');
      
      const approvalsMap = new Map<string, CoachingApproval>();
      const pendingSet = new Set<string>();
      
      for (const product of coachingProducts) {
        const approval = await getCoachingApproval(user.id, product.id);
        if (approval) {
          approvalsMap.set(product.id, {
            id: approval.id,
            athleteId: approval.athlete_id,
            productId: approval.product_id,
            consultationCompleted: approval.consultation_completed,
            consultationAppointmentId: approval.consultation_appointment_id,
            approved: approval.approved,
            approvedBy: approval.approved_by,
            approvedAt: approval.approved_at,
            rejectedAt: approval.rejected_at,
            rejectionReason: approval.rejection_reason,
            isManualGrant: approval.is_manual_grant,
            grantReason: approval.grant_reason,
            createdAt: approval.created_at,
          });
        }
      }
      
      // Check for pending appointments (consultation booked but not completed)
      const appointments = await getAppointments(undefined, user.id);
      appointments.forEach((apt: any) => {
        if (apt.type === 'CONSULTATION' && apt.status !== 'COMPLETED') {
          // Find the product this consultation is for
          const product = coachingProducts.find((p: any) => p.coach_id === apt.coach_id);
          if (product) {
            pendingSet.add(product.id);
          }
        }
      });
      
      setCoachingApprovals(approvalsMap);
      setPendingConsultations(pendingSet);
    } catch (error) {
      console.error('Error fetching coaching approvals:', error);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;
    const purchased = new Set<string>();
    const activeSubs = new Set<string>();

    try {
      // 1. Fetch from Supabase purchases table (source of truth)
      const dbPurchases = await getUserPurchases(user.id);
      dbPurchases.forEach((p: any) => {
        if (p.product_id) purchased.add(p.product_id);
      });

      // 2. Also check Stripe API for subscriptions
      if (user.email) {
        try {
          const response = await fetch('/api/get-customer-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerEmail: user.email }),
          });
          if (response.ok) {
            const data = await response.json();
            (data.subscriptions || []).forEach((sub: any) => {
              if (sub.status === 'active' || sub.status === 'trialing') {
                activeSubs.add(sub.productName);
              }
            });
            // Map Stripe one-time purchases by product metadata
            (data.purchases || []).forEach((p: any) => {
              if (p.productId) purchased.add(p.productId);
            });
          }
        } catch (stripeErr) {
          console.warn("Stripe API not available, using DB only:", stripeErr);
        }
      }
    } catch (error) {
      console.error("Error fetching purchases", error);
    } finally {
      setPurchasedProductIds(purchased);
      setActiveSubscriptionIds(activeSubs);
      setStripeDataLoaded(true);
    }
  };

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
        calendarId: d.calendar_id,
        requiresConsultation: d.requires_consultation ?? false,
        consultationCalendarMode: d.consultation_calendar_mode || 'all',
        intakeFormEnabled: d.intake_form_enabled ?? false,
      } as any)));
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

  // Nach erfolgreicher Zahlung: Plan zuweisen ODER Coaching Relationship erstellen
  const handlePurchaseSuccess = async (product: Product) => {
    if (!user) return;
    setPurchasing(product.id);
    
    try {
        // COACHING_1ON1: Create relationship, NO plan assignment
        if (product.type === 'COACHING_1ON1') {
            await createCoachingRelationship({
                athlete_id: user.id,
                coach_id: product.coachId,
                product_id: product.id,
            });

            // Notify the coach about the new athlete (In-App + Email)
            if (product.coachId) {
              const athleteName = user.email?.split('@')[0] || 'Ein Athlet';

              // In-App Bell notification
              createNotification({
                user_id: product.coachId,
                type: 'coach_assignment',
                title: 'Neuer Coaching-Athlet',
                message: `${athleteName} hat "${product.title}" gebucht.`,
              }).catch(err => console.error('Coach notification failed:', err));

              // Email notification to coach
              try {
                const { data: coachProfile } = await supabase.from('profiles').select('email, first_name').eq('id', product.coachId).maybeSingle();
                if (coachProfile?.email) {
                  fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'coach_new_athlete',
                      to: coachProfile.email,
                      data: {
                        coachName: coachProfile.first_name || 'Coach',
                        athleteName,
                        athleteEmail: user.email || '',
                        assignDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        reason: `Kauf: ${product.title}`,
                        dashboardLink: 'https://greenlight-fitness-app.vercel.app/',
                      },
                    }),
                  }).catch(err => console.error('Coach email failed:', err));
                }
              } catch (e) { console.error('Coach email lookup failed:', e); }
            }

            // Notify admins about the purchase (free products don't go through Stripe webhook)
            try {
              const { data: admins } = await supabase.from('profiles').select('id, email, first_name').eq('role', 'ADMIN');
              if (admins && admins.length > 0) {
                const athleteEmail = user.email || 'Unbekannt';
                // In-App Bell notifications
                await supabase.from('notifications').insert(
                  admins.map((a: any) => ({
                    user_id: a.id,
                    type: 'purchase',
                    title: 'Neuer Kauf',
                    message: `${athleteEmail} hat "${product.title}" gebucht`,
                    read: false,
                  }))
                );
                // Email notifications to admins
                for (const admin of admins) {
                  if (admin.email) {
                    fetch('/api/send-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'admin_new_purchase',
                        to: admin.email,
                        data: {
                          adminName: admin.first_name || 'Admin',
                          customerEmail: athleteEmail,
                          customerName: user.email?.split('@')[0] || '',
                          productName: product.title,
                          amount: product.price ? `${product.price.toFixed(2)} EUR` : 'Gratis',
                          purchaseDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                          dashboardLink: 'https://greenlight-fitness-app.vercel.app/admin/crm',
                        },
                      }),
                    }).catch(err => console.error('Admin email failed:', err));
                  }
                }
              }
            } catch (e) { console.error('Admin purchase notif failed:', e); }
            
            // Record the purchase to prevent re-buying
            const { data: purchaseRecord } = await supabase.from('purchases').insert({
              user_id: user.id,
              product_id: product.id,
              status: 'completed',
            }).select().single();

            // Get the coaching relationship for intake form link
            const { data: newRelationship } = await supabase
              .from('coaching_relationships')
              .select('id')
              .eq('athlete_id', user.id)
              .eq('product_id', product.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Create purchase confirmation (§312i BGB)
            const confirmationNumber = `GL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const intakeEnabled = (product as any).intakeFormEnabled ?? false;
            const confirmation = await createPurchaseConfirmation({
              user_id: user.id,
              product_id: product.id,
              purchase_id: purchaseRecord?.id,
              confirmation_number: confirmationNumber,
              product_title: product.title,
              product_type: product.type,
              amount: product.price || 0,
              currency: product.currency || 'EUR',
              interval: product.interval,
              status: 'PENDING_COACH',
              coach_id: product.coachId,
              metadata: {
                coaching_relationship_id: newRelationship?.id,
                intake_form_enabled: intakeEnabled,
              },
            });

            // Create pending intake record if intake form is enabled
            if (intakeEnabled && newRelationship?.id) {
              try {
                await supabase.from('coaching_intake').insert({
                  athlete_id: user.id,
                  coaching_relationship_id: newRelationship.id,
                  product_id: product.id,
                  status: 'PENDING',
                });
              } catch (e) { console.error('Intake creation failed:', e); }
            }

            setSelectedProduct(null);
            fetchCoachingApprovals();
            fetchPurchases();
            navigate(`/purchase-confirmation?id=${confirmation.id}`);
            return;
        }
        
        // PLAN product: Assign the plan
        const planId = product.planId;
        if (!planId) {
            alert("Kauf erfolgreich!");
            setSelectedProduct(null);
            return;
        }
        
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

        // Record the purchase to prevent re-buying
        const { data: planPurchaseRecord } = await supabase.from('purchases').insert({
          user_id: user.id,
          product_id: product.id,
          status: 'completed',
        }).select().single();

        // Create purchase confirmation (§312i BGB)
        const planConfNumber = `GL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const planConfirmation = await createPurchaseConfirmation({
          user_id: user.id,
          product_id: product.id,
          purchase_id: planPurchaseRecord?.id,
          confirmation_number: planConfNumber,
          product_title: product.title,
          product_type: product.type,
          amount: product.price || 0,
          currency: product.currency || 'EUR',
          interval: product.interval,
          status: 'CONFIRMED',
        });

        setSelectedProduct(null);
        fetchOwnedPlans();
        fetchPurchases();
        navigate(`/purchase-confirmation?id=${planConfirmation.id}`);
        
    } catch (error) {
        console.error("Purchase processing failed:", error);
        alert("Fehler beim Verarbeiten des Kaufs. Bitte kontaktiere den Support.");
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
      const alreadyOwned = product && (
        ownedPlanIds.has(product.planId) || purchasedProductIds.has(product.id)
      );
      if (product && !alreadyOwned) {
        // Clean URL first to prevent re-trigger on re-render
        window.history.replaceState({}, '', '/shop');
        handlePurchaseSuccess(product);
      } else if (product) {
        // Already owned, just clean URL
        window.history.replaceState({}, '', '/shop');
      }
    }
    
    if (params.get('canceled') === 'true') {
      alert("Zahlung abgebrochen.");
      window.history.replaceState({}, '', '/shop');
    }
  }, [products, ownedPlanIds, purchasedProductIds]);

  const handleBookAppointment = async (dateOverride?: string, timeOverride?: string) => {
      const bookDate = dateOverride || selectedDate;
      const bookTime = timeOverride || selectedTime;
      if(!user || !selectedProduct || !bookDate || !bookTime) return;
      setPurchasing('booking');
      
      try {
          // Create the appointment
          const calId = (selectedProduct as any).calendarId || null;
          const appointment = await createAppointment({
              athlete_id: user.id,
              athlete_name: user.email || 'Athlete',
              coach_id: selectedProduct.coachId,
              date: bookDate,
              time: bookTime,
              status: 'PENDING',
              type: 'CONSULTATION',
              calendar_id: calId,
          });
          
          // Create a coaching approval entry for products requiring consultation
          if ((selectedProduct as any).requiresConsultation || selectedProduct.type === 'COACHING_1ON1') {
              await createCoachingApproval({
                  athlete_id: user.id,
                  product_id: selectedProduct.id,
                  consultation_appointment_id: appointment.id,
              });
              
              // Refresh approvals
              await fetchCoachingApprovals();
          }
          
          alert("Vorabgespräch angefragt! Dein Coach wird sich bei dir melden.");
          setSelectedProduct(null);
          setBookingMode(false);
      } catch (error) {
          console.error("Booking failed:", error);
          alert("Buchung fehlgeschlagen.");
      } finally {
          setPurchasing(null);
      }
  };

  const filteredProducts = products.filter(p => activeCategory === 'ALL' || p.category === activeCategory);

  return (
    <div className="space-y-6 animate-in fade-in">
      
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
             const isOwned = ownedPlanIds.has(product.planId) || purchasedProductIds.has(product.id) || activeSubscriptionIds.has(product.title);
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
                      <div className="p-6 max-w-2xl mx-auto">
                          {(selectedProduct as any).calendarId ? (
                              <BookingWidget
                                calendarId={(selectedProduct as any).calendarId}
                                calendarName={selectedProduct.title}
                                onSelectSlot={(date, time) => {
                                  handleBookAppointment(date, time);
                                }}
                                onCancel={() => setBookingMode(false)}
                              />
                          ) : (
                              <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8">
                                  <h3 className="text-2xl font-bold text-white mb-2">Termin buchen</h3>
                                  <p className="text-zinc-400 mb-6">W\u00e4hle einen Termin f\u00fcr dein kostenloses Erstgespr\u00e4ch.</p>
                                  
                                  <div className="space-y-4">
                                      <div className="flex flex-col gap-2">
                                          <label className="text-xs font-bold uppercase text-zinc-500">Datum</label>
                                          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white w-full focus:border-[#00FF00] outline-none" />
                                      </div>
                                      <div className="flex flex-col gap-2">
                                          <label className="text-xs font-bold uppercase text-zinc-500">Uhrzeit</label>
                                          <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white w-full focus:border-[#00FF00] outline-none">
                                              <option value="">Zeit w\u00e4hlen</option>
                                              <option value="09:00">09:00</option>
                                              <option value="10:00">10:00</option>
                                              <option value="11:00">11:00</option>
                                              <option value="14:00">14:00</option>
                                              <option value="15:00">15:00</option>
                                              <option value="16:00">16:00</option>
                                          </select>
                                      </div>
                                      <Button onClick={() => handleBookAppointment()} disabled={!selectedDate || !selectedTime || purchasing === 'booking'} fullWidth className="mt-4">
                                          {purchasing === 'booking' ? "Buche..." : "Termin best\u00e4tigen"}
                                      </Button>
                                      <button onClick={() => setBookingMode(false)} className="w-full text-center text-zinc-500 py-4 hover:text-white">Abbrechen</button>
                                  </div>
                              </div>
                          )}
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
                      <div className="max-w-3xl mx-auto">
                          {/* Already owned */}
                          {(ownedPlanIds.has(selectedProduct.planId) || purchasedProductIds.has(selectedProduct.id) || activeSubscriptionIds.has(selectedProduct.title)) ? (
                              <Button disabled fullWidth className="opacity-50 cursor-not-allowed bg-[#00FF00]/20 border-[#00FF00]/30">
                                  <Check size={18} className="mr-2" /> Bereits gekauft
                              </Button>
                          ) : ((selectedProduct as any).requiresConsultation || selectedProduct.type === 'COACHING_1ON1') ? (
                              // GATED PURCHASE FLOW for products requiring consultation
                              (() => {
                                  const approval = coachingApprovals.get(selectedProduct.id);
                                  const hasPendingConsultation = pendingConsultations.has(selectedProduct.id);
                                  const isApproved = approval?.approved === true;
                                  const isRejected = !!approval?.rejectedAt;
                                  
                                  // Case 1: Approved - Can purchase
                                  if (isApproved) {
                                      return (
                                          <div className="space-y-3">
                                              <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 rounded-xl p-3 flex items-center gap-3">
                                                  <CheckCircle2 size={20} className="text-[#00FF00]" />
                                                  <span className="text-sm text-[#00FF00] font-medium">Du bist freigeschaltet! Jetzt kannst du buchen.</span>
                                              </div>
                                              <Button 
                                                  onClick={() => handlePurchase(selectedProduct)} 
                                                  disabled={!!purchasing} 
                                                  fullWidth
                                                  className="shadow-[0_0_20px_rgba(0,255,0,0.3)]"
                                              >
                                                  {purchasing === selectedProduct.id ? "Processing..." : `Jetzt buchen • ${selectedProduct.price} ${selectedProduct.currency}`}
                                              </Button>
                                          </div>
                                      );
                                  }
                                  
                                  // Case 2: Rejected
                                  if (isRejected) {
                                      return (
                                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                              <p className="text-red-400 font-medium">Leider wurde deine Anfrage abgelehnt.</p>
                                              {approval?.rejectionReason && (
                                                  <p className="text-zinc-500 text-sm mt-1">{approval.rejectionReason}</p>
                                              )}
                                          </div>
                                      );
                                  }
                                  
                                  // Case 3: Consultation booked, waiting
                                  if (hasPendingConsultation || (approval && !approval.approved)) {
                                      return (
                                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center space-y-2">
                                              <div className="flex items-center justify-center gap-2">
                                                  <Clock size={20} className="text-blue-400" />
                                                  <span className="text-blue-400 font-medium">Vorabgespräch gebucht</span>
                                              </div>
                                              <p className="text-zinc-400 text-sm">
                                                  Nach dem Gespräch wirst du freigeschaltet und kannst das Coaching buchen.
                                              </p>
                                          </div>
                                      );
                                  }
                                  
                                  // Case 4: No consultation yet - Show booking button only
                                  return (
                                      <div className="space-y-3">
                                          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                                              <p className="text-zinc-300 text-sm font-medium mb-1">
                                                  {selectedProduct.type === 'COACHING_1ON1' ? 'Für 1:1 Coaching ist ein kostenloses Vorabgespräch erforderlich.' : 'Für dieses Produkt ist ein kostenloses Vorabgespräch erforderlich.'}
                                              </p>
                                              <p className="text-zinc-500 text-xs">
                                                  Buche jetzt einen Termin – danach wirst du für den Kauf freigeschaltet.
                                              </p>
                                          </div>
                                          <Button 
                                              onClick={() => setBookingMode(true)} 
                                              fullWidth
                                              className="shadow-[0_0_20px_rgba(0,255,0,0.3)]"
                                          >
                                              <Phone size={18} className="mr-2" /> Kostenloses Vorabgespräch buchen
                                          </Button>
                                      </div>
                                  );
                              })()
                          ) : (
                              // Normal product - Direct purchase
                              <Button 
                                  onClick={() => handlePurchase(selectedProduct)} 
                                  disabled={!!purchasing} 
                                  fullWidth
                                  className="shadow-[0_0_20px_rgba(0,255,0,0.3)]"
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