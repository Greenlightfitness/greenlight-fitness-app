import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore/lite';
import { db } from '../services/firebase';
import { AssignedPlan, Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hasActiveCoaching, setHasActiveCoaching] = useState<boolean | null>(null); // Null = loading
  const [loading, setLoading] = useState(true);
  const [coachingProduct, setCoachingProduct] = useState<Product | null>(null);

  useEffect(() => {
    checkCoachingStatus();
  }, [user]);

  const checkCoachingStatus = async () => {
    if (!user) return;
    try {
        // Check for active Assigned Plan that is linked to a 1:1 Product
        // Simplified logic: Check if user has ANY plan assigned that came from a COACHING_1ON1 product.
        // First get 1:1 products
        const prodQ = query(collection(db, 'products'), where('type', '==', 'COACHING_1ON1'));
        const prodSnap = await getDocs(prodQ);
        
        let foundActive = false;
        let promoProduct = null;

        if (!prodSnap.empty) {
            promoProduct = { id: prodSnap.docs[0].id, ...prodSnap.docs[0].data() } as Product;
            setCoachingProduct(promoProduct);

            // Now check if user has bought this
            const coachingPlanIds = prodSnap.docs.map(d => d.data().planId);
            
            if (coachingPlanIds.length > 0) {
                const planQ = query(collection(db, 'assigned_plans'), where('athleteId', '==', user.uid));
                const planSnap = await getDocs(planQ);
                
                planSnap.forEach(d => {
                    const data = d.data() as AssignedPlan;
                    if (coachingPlanIds.includes(data.originalPlanId)) {
                        foundActive = true;
                    }
                });
            }
        }
        setHasActiveCoaching(foundActive);

    } catch (error) {
        console.error("Error checking coaching status", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-[#00FF00]">Loading...</div>;

  // --- VIEW: ACTIVE CHAT ---
  if (hasActiveCoaching) {
      return (
          <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00FF00] flex items-center justify-center text-black font-bold">C</div>
                  <div>
                      <h2 className="font-bold text-white">Coach</h2>
                      <span className="text-xs text-[#00FF00] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-pulse"></span> Online</span>
                  </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-zinc-500 gap-4">
                  <MessageCircle size={48} className="opacity-20" />
                  <p>Start messaging your coach here.</p>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl max-w-xs w-full text-sm">
                      <p className="text-zinc-300">👋 Hey! Welcome to 1:1 coaching. How is your training going this week?</p>
                      <span className="text-[10px] text-zinc-600 mt-2 block text-right">10:00 AM</span>
                  </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-black sticky bottom-0">
                  <div className="flex gap-2">
                      <input placeholder="Type a message..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-3 text-white focus:border-[#00FF00] outline-none" />
                      <button className="w-12 h-12 rounded-full bg-[#00FF00] flex items-center justify-center text-black hover:scale-105 transition-transform">
                          <ArrowRight size={20} />
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- VIEW: SALES PAGE (LOCKED) ---
  return (
      <div className="min-h-screen pb-32 animate-in slide-in-from-bottom-8">
          {/* Hero */}
          <div className="relative h-[50vh] w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
              {coachingProduct?.thumbnailUrl ? (
                  <img src={coachingProduct.thumbnailUrl} className="w-full h-full object-cover" alt="Coaching" />
              ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Lock size={64} className="text-zinc-800" /></div>
              )}
              <div className="absolute bottom-8 left-6 right-6 z-20">
                  <div className="bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                      <Lock size={12} /> Premium Access
                  </div>
                  <h1 className="text-4xl font-extrabold text-white leading-tight mb-2">
                      Unlock Elite <br/> 1:1 Coaching
                  </h1>
                  <p className="text-lg text-zinc-300 max-w-sm">
                      Get personalized programming, form checks, and direct access to your coach.
                  </p>
              </div>
          </div>

          {/* Benefits */}
          <div className="px-6 py-8 space-y-8">
              <div className="grid gap-6">
                  <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF00] shrink-0">
                          <CheckCircle2 size={24} />
                      </div>
                      <div>
                          <h3 className="font-bold text-white text-lg">Custom Programming</h3>
                          <p className="text-zinc-400 text-sm leading-relaxed">Training plans built specifically for your goals, equipment, and schedule.</p>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF00] shrink-0">
                          <MessageCircle size={24} />
                      </div>
                      <div>
                          <h3 className="font-bold text-white text-lg">Direct Chat Access</h3>
                          <p className="text-zinc-400 text-sm leading-relaxed">24/7 priority support. Send videos for form analysis and get feedback.</p>
                      </div>
                  </div>
              </div>

              {/* CTA */}
              <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Ready to level up?</h3>
                  <p className="text-zinc-400 mb-6 text-sm">Join the elite team today.</p>
                  
                  <Button onClick={() => navigate('/shop')} fullWidth size="lg" className="shadow-[0_0_20px_rgba(0,255,0,0.3)]">
                      Go to Shop
                  </Button>
              </div>
          </div>
      </div>
  );
};

export default Chat;