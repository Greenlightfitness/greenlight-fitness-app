import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getPlans, createProduct, updateProduct, deleteProduct, uploadFile, getPublicUrl, getCoachCalendars, getAllCoachCalendars, saveProductCalendars, getProductCalendars, supabase, getIntakeForms, createNotification } from '../services/supabase';
import type { IntakeForm } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, TrainingPlan, ProductCategory, ProductType } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  Package, Plus, Trash2, Edit, X, Image as ImageIcon, Upload, Loader2,
  ChevronLeft, DollarSign, Tag, FileText, Layers, CheckCircle, Calendar,
  AlertCircle, Eye, EyeOff, Link2, Sparkles, Save, Info, AlertTriangle, Scale, Gift,
  MessageSquare, Users, ClipboardList
} from 'lucide-react';
import PriceChangeChecklist from '../components/PriceChangeChecklist';
import ConfirmActionModal, { ConfirmActionConfig } from '../components/ConfirmActionModal';

type ViewMode = 'list' | 'create' | 'edit';

const AdminProducts: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isAdmin = userProfile?.role === 'ADMIN';
  const isReadOnly = !isAdmin;
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Product> & { selectedPlanIds?: string[]; hasChatAccess?: boolean }>({
    title: '',
    description: '',
    longDescription: '',
    price: '' as any,
    currency: 'EUR',
    interval: 'month',
    planId: '',
    thumbnailUrl: '',
    category: 'GENERAL',
    type: 'PLAN',
    features: [],
    isActive: true,
    selectedPlanIds: [],
    hasChatAccess: false,
    trialDays: 0,
    requiresConsultation: false,
    consultationCalendarMode: 'all',
  });

  const [allCalendars, setAllCalendars] = useState<any[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [consultationCalendarIds, setConsultationCalendarIds] = useState<string[]>([]);

  const [currentFeature, setCurrentFeature] = useState('');
  const [creatingStripe, setCreatingStripe] = useState(false);
  const [showPriceChangeWarning, setShowPriceChangeWarning] = useState(false);
  const [pendingFormSubmit, setPendingFormSubmit] = useState<React.FormEvent | null>(null);
  const [coachCalendars, setCoachCalendars] = useState<any[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  // Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<ConfirmActionConfig | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
        isActive: d.is_active ?? true,
        trialDays: d.trial_days || 0,
        hasChatAccess: d.has_chat_access ?? false,
        calendar_id: d.calendar_id || null,
        stripeProductId: d.stripe_product_id || null,
        stripePriceId: d.stripe_price_id || null,
        requiresConsultation: d.requires_consultation ?? false,
        consultationCalendarMode: d.consultation_calendar_mode || 'all',
        coachingDurationWeeks: d.coaching_duration_weeks || null,
        sessionsPerWeek: d.sessions_per_week || null,
        intakeFormEnabled: d.intake_form_enabled ?? false,
        intakeFormId: d.intake_form_id || null,
        defaultCoachId: d.default_coach_id || null,
      } as Product)));

      const planData = await getPlans();
      setPlans(planData.map((d: any) => ({
        id: d.id,
        coachId: d.coach_id,
        name: d.name,
        description: d.description,
        createdAt: d.created_at,
      } as TrainingPlan)));

      const calData = await getCoachCalendars(user.id);
      setCoachCalendars(calData);

      // Load ALL coach calendars for consultation assignment
      try {
        const allCals = await getAllCoachCalendars();
        setAllCalendars(allCals);
      } catch (e) {
        console.warn('Could not load all calendars:', e);
        setAllCalendars(calData); // fallback to own calendars
      }

      try {
        const forms = await getIntakeForms();
        setIntakeForms(forms);
      } catch (e) {
        console.warn('Could not load intake forms:', e);
      }
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
      price: '' as any,
      currency: 'EUR',
      interval: 'month',
      planId: '',
      thumbnailUrl: '',
      category: 'GENERAL',
      type: 'PLAN',
      features: [],
      isActive: true,
      selectedPlanIds: [],
      trialDays: 0,
      requiresConsultation: false,
      consultationCalendarMode: 'all',
    });
    setCurrentFeature('');
    setEditingProduct(null);
    setConsultationCalendarIds([]);
  };

  const handleCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleEdit = async (product: any) => {
    setEditingProduct(product);
    setFormData({ ...product, selectedPlanIds: [] });
    setViewMode('edit');

    // Load product_plans (which plans are assigned)
    try {
      const { data: ppData } = await supabase
        .from('product_plans')
        .select('plan_id')
        .eq('product_id', product.id)
        .order('sort_order', { ascending: true });
      const planIds = (ppData || []).map((pp: any) => pp.plan_id);
      setFormData(prev => ({ ...prev, selectedPlanIds: planIds.length > 0 ? planIds : (product.planId ? [product.planId] : []) }));
    } catch {
      // Fallback to single planId
      if (product.planId) setFormData(prev => ({ ...prev, selectedPlanIds: [product.planId] }));
    }

    // Load multi-calendar assignments
    try {
      const pcs = await getProductCalendars(product.id);
      const ids = pcs.map((pc: any) => pc.calendar_id);
      setSelectedCalendarIds(ids.length > 0 ? ids : product.calendar_id ? [product.calendar_id] : []);
      // Also use for consultation calendars
      setConsultationCalendarIds(ids.length > 0 ? ids : product.calendar_id ? [product.calendar_id] : []);
    } catch {
      setSelectedCalendarIds(product.calendar_id ? [product.calendar_id] : []);
      setConsultationCalendarIds(product.calendar_id ? [product.calendar_id] : []);
    }
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
      
      setFormData(prev => ({ ...prev, thumbnailUrl: `${downloadUrl}?t=${Date.now()}` }));
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

  // Check if price or important details changed for existing subscribers
  const hasSignificantChanges = (original: Product | null, updated: Partial<Product>) => {
    if (!original) return false;
    return (
      original.price !== updated.price ||
      original.interval !== updated.interval ||
      original.title !== updated.title
    );
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
    if (formData.price === undefined || formData.price === null || formData.price < 0) {
      setError("Bitte gib einen gültigen Preis ein (0 für kostenlos).");
      return;
    }
    if (!formData.selectedPlanIds || formData.selectedPlanIds.length === 0) {
      setError("Bitte wähle mindestens einen Plan aus.");
      return;
    }

    // Show warning for significant changes to existing products
    if (editingProduct && hasSignificantChanges(editingProduct, formData) && !showPriceChangeWarning) {
      setPendingFormSubmit(e);
      setShowPriceChangeWarning(true);
      return;
    }

    setSaving(true);
    setError(null);
    setShowPriceChangeWarning(false);
    
    try {
      // 1. Try to create in Stripe first (optional - won't fail if Stripe not configured)
      setCreatingStripe(true);
      let stripeData = null;
      if (!editingProduct && Number(formData.price) > 0) {
        stripeData = await createStripeProduct({
          title: formData.title?.trim(),
          description: formData.description?.trim(),
          price: formData.price,
          currency: formData.currency,
          interval: formData.interval,
          trialDays: formData.trialDays || 0,
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
        has_chat_access: formData.hasChatAccess ?? false,
        calendar_id: selectedCalendarIds[0] || null,
        trial_days: formData.trialDays || 0,
        stripe_product_id: stripeData?.stripe_product_id || null,
        stripe_price_id: stripeData?.stripe_price_id || null,
        requires_consultation: formData.requiresConsultation ?? false,
        consultation_calendar_mode: formData.consultationCalendarMode || 'all',
        // 1:1 Coaching specific fields
        coaching_duration_weeks: (formData as any).coachingDurationWeeks || null,
        sessions_per_week: (formData as any).sessionsPerWeek || null,
        intake_form_enabled: (formData as any).intakeFormEnabled ?? false,
        intake_form_id: (formData as any).intakeFormId || null,
        default_coach_id: (formData as any).defaultCoachId || null,
      };
      
      console.log("Saving product with payload:", payload);
      
      let productId: string;
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        productId = editingProduct.id;
        // Optimistically update local state so changes appear immediately
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
          ...p,
          title: payload.title,
          description: payload.description,
          longDescription: payload.long_description,
          features: payload.features,
          category: payload.category,
          type: payload.type,
          price: payload.price,
          currency: payload.currency,
          interval: payload.interval,
          thumbnailUrl: payload.thumbnail_url,
          isActive: payload.is_active,
          hasChatAccess: payload.has_chat_access,
          trialDays: payload.trial_days,
          requiresConsultation: payload.requires_consultation,
          consultationCalendarMode: payload.consultation_calendar_mode,
        } as Product : p));
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

      // 4. Save product-calendar relationships (multi-coach)
      const calIds = formData.requiresConsultation && formData.consultationCalendarMode === 'selected'
        ? consultationCalendarIds
        : selectedCalendarIds;
      if (calIds.length > 0) {
        await saveProductCalendars(productId, calIds);
      }

      // 5. Notify existing athletes if intake form was newly added/changed
      if (editingProduct && payload.intake_form_enabled && payload.intake_form_id) {
        const previousFormId = editingProduct.intakeFormId;
        const formChanged = !previousFormId || previousFormId !== payload.intake_form_id;
        if (formChanged) {
          try {
            // Find all active coaching relationships for this product
            const { data: activeRels } = await supabase
              .from('coaching_relationships')
              .select('id, athlete_id, product_id')
              .eq('product_id', productId)
              .eq('status', 'ACTIVE');

            if (activeRels && activeRels.length > 0) {
              // Check which athletes already submitted a response for this form
              const { data: existingResponses } = await supabase
                .from('intake_responses')
                .select('athlete_id')
                .eq('intake_form_id', payload.intake_form_id)
                .in('athlete_id', activeRels.map(r => r.athlete_id))
                .eq('status', 'SUBMITTED');

              const submittedAthleteIds = new Set((existingResponses || []).map((r: any) => r.athlete_id));

              // Notify athletes who haven't filled it out yet
              const toNotify = activeRels.filter(r => !submittedAthleteIds.has(r.athlete_id));
              for (const rel of toNotify) {
                await createNotification({
                  user_id: rel.athlete_id,
                  type: 'intake_form',
                  title: 'Neuer Fragebogen verfügbar',
                  message: `Dein Coach hat einen Fragebogen zu "${payload.title}" hinzugefügt. Bitte fülle ihn aus.`,
                });
              }
              if (toNotify.length > 0) {
                console.log(`Intake form notifications sent to ${toNotify.length} athletes`);
              }
            }
          } catch (notifyErr) {
            console.warn('Could not send intake form notifications:', notifyErr);
          }
        }
      }
      
      await fetchData();
      setViewMode('list');
      resetForm();
      
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

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id);
    const isSubscription = product?.interval && product.interval !== 'onetime';
    setConfirmConfig({
      title: `"${product?.title || 'Produkt'}" löschen?`,
      description: 'Das Produkt wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
      severity: 'danger',
      checklist: [
        { id: 'understand', label: 'Mir ist bewusst, dass das Produkt dauerhaft entfernt wird', required: true },
        ...(isSubscription ? [
          { id: 'stripe', label: 'Bestehende Stripe-Abonnements müssen separat in Stripe storniert/migriert werden', required: true },
          { id: 'subscribers', label: 'Aktive Abonnenten verlieren den Zugang zu diesem Produkt', required: true },
        ] : []),
        { id: 'confirm', label: 'Ich möchte dieses Produkt wirklich löschen', required: true },
      ],
      confirmLabel: 'Endgültig löschen',
    });
    setConfirmAction(() => async () => {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
        setSuccess('Produkt gelöscht!');
      } catch (err: any) {
        setError(`Fehler beim Löschen: ${err.message}`);
      }
    });
  };

  const handleToggleActive = (product: Product) => {
    const isDeactivating = product.isActive !== false;
    const isSubscription = product.interval && product.interval !== 'onetime';

    if (isDeactivating) {
      // Deactivating requires confirmation — could affect Stripe subscribers
      setConfirmConfig({
        title: `"${product.title}" deaktivieren?`,
        description: isSubscription
          ? 'Dieses Produkt hat ein Abo-Intervall. Das Deaktivieren kann aktive Stripe-Abonnements beeinträchtigen.'
          : 'Das Produkt wird im Shop nicht mehr angezeigt. Bestehende Käufer behalten ihren Zugang.',
        severity: isSubscription ? 'danger' : 'warning',
        checklist: [
          { id: 'hidden', label: 'Mir ist bewusst, dass das Produkt im Shop nicht mehr sichtbar ist', required: true },
          ...(isSubscription ? [
            { id: 'stripe-subs', label: 'Aktive Stripe-Abonnements laufen weiter — Neukäufe werden verhindert', required: true },
            { id: 'stripe-check', label: 'Ich habe geprüft, ob bestehende Abonnenten informiert werden müssen', required: true },
          ] : []),
          { id: 'confirm', label: 'Ich möchte dieses Produkt wirklich deaktivieren', required: true },
        ],
        confirmLabel: 'Produkt deaktivieren',
      });
      setConfirmAction(() => async () => {
        try {
          await updateProduct(product.id, { is_active: false });
          setProducts(products.map(p => p.id === product.id ? { ...p, isActive: false } : p));
          setSuccess('Produkt deaktiviert');
        } catch (err: any) {
          setError(`Fehler: ${err.message}`);
        }
      });
    } else {
      // Reactivating is safe — no confirmation needed
      (async () => {
        try {
          await updateProduct(product.id, { is_active: true });
          setProducts(products.map(p => p.id === product.id ? { ...p, isActive: true } : p));
          setSuccess('Produkt aktiviert');
        } catch (err: any) {
          setError(`Fehler: ${err.message}`);
        }
      })();
    }
  };

  const executeConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await confirmAction();
    } finally {
      setConfirmLoading(false);
      setConfirmConfig(null);
      setConfirmAction(null);
    }
  };

  const cancelConfirm = () => {
    setConfirmConfig(null);
    setConfirmAction(null);
    setConfirmLoading(false);
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
              Produkte <span className={`text-xs px-2 py-1 rounded border ${isAdmin ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{isAdmin ? 'Admin' : 'Ansicht'}</span>
            </h1>
            <p className="text-zinc-400 mt-2">{isAdmin ? 'Verwalte deine Shop-Produkte und Trainingspläne' : 'Übersicht aller aktiven Produkte'}</p>
          </div>
          {isAdmin && (
            <Button onClick={handleCreate} className="flex items-center gap-2 shadow-lg shadow-[#00FF00]/10">
              <Plus size={20} /> Neues Produkt
            </Button>
          )}
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
            <p className="text-sm text-zinc-600 mb-6">{isAdmin ? 'Erstelle dein erstes Produkt, um loszulegen' : 'Es wurden noch keine Produkte angelegt.'}</p>
            {isAdmin && (
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus size={18} /> Produkt erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isReadOnly ? products.filter(p => p.isActive) : products).map(product => (
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
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(product)} className="bg-black/80 p-2 rounded-lg text-white hover:text-[#00FF00] transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="bg-black/80 p-2 rounded-lg text-white hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[#00FF00] font-bold text-xl">{product.price} {product.currency}</span>
                    <span className="text-[9px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded uppercase font-bold">
                      {product.interval === 'onetime' ? 'Einmalig' : `/ ${product.interval}`}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-4">{product.description}</p>

                  {/* Status toggle (admin only) / Status badge (coach) */}
                  {isAdmin ? (
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                        product.isActive
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40'
                          : 'bg-[#00FF00]/10 border border-[#00FF00]/20 text-[#00FF00] hover:bg-[#00FF00]/20 hover:border-[#00FF00]/40'
                      }`}
                    >
                      {product.isActive ? (
                        <>
                          <EyeOff size={14} />
                          Produkt deaktivieren
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          Produkt aktivieren
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-[#00FF00]/10 border border-[#00FF00]/20 text-[#00FF00]">
                      <Eye size={14} /> Aktiv
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal (list view) */}
        {confirmConfig && (
          <ConfirmActionModal
            config={confirmConfig}
            loading={confirmLoading}
            onConfirm={executeConfirm}
            onCancel={cancelConfirm}
          />
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

          {/* Row 1: Zahlungsart */}
          <div className="space-y-2 mb-5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Zahlungsart *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'onetime', label: 'Einmalzahlung', desc: 'Einmalige Zahlung' },
                { value: 'month', label: 'Monatsabo', desc: 'Wiederkehrend / Monat' },
                { value: 'year', label: 'Jahresabo', desc: 'Wiederkehrend / Jahr' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({...formData, interval: opt.value as any, ...(opt.value === 'onetime' ? { trialDays: 0 } : {})})}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.interval === opt.value
                      ? 'bg-[#00FF00]/10 border-[#00FF00]/40 ring-1 ring-[#00FF00]/20'
                      : 'bg-[#121212] border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className={`text-sm font-bold block ${formData.interval === opt.value ? 'text-[#00FF00]' : 'text-white'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Preis & Währung */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Preis * <span className="text-zinc-600 normal-case">(0 = kostenlos)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price == null || (formData.price as any) === '' ? '' : formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value === '' ? ('' as any) : Number(e.target.value)})}
                  className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-3.5 focus:border-[#00FF00] outline-none transition-colors"
                  placeholder="0.00"
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
            <div className="flex items-end pb-1">
              {Number(formData.price) === 0 && (
                <div className="bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-xl px-4 py-3 flex items-center gap-2 w-full">
                  <Gift size={18} className="text-[#00FF00]" />
                  <span className="text-[#00FF00] font-bold text-sm">Kostenlos</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Free Trial (only for subscriptions) */}
          {formData.interval && formData.interval !== 'onetime' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Kostenloser Testzeitraum <span className="text-zinc-600 normal-case">(optional)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    step="1"
                    value={formData.trialDays || 0}
                    onChange={e => setFormData({...formData, trialDays: Math.max(0, Math.min(365, Number(e.target.value)))})}
                    className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl pl-4 pr-16 py-3.5 focus:border-[#00FF00] outline-none transition-colors"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">Tage</span>
                </div>
                <div className="flex items-center">
                  {Number(formData.trialDays) > 0 ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center gap-2 w-full">
                      <Calendar size={16} className="text-blue-400" />
                      <span className="text-blue-400 text-sm">
                        <strong>{formData.trialDays} Tage</strong> kostenlos testen, dann {formData.price} {formData.currency}/{formData.interval === 'year' ? 'Jahr' : 'Monat'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600">Kein Testzeitraum — Zahlung startet sofort</p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 flex items-center gap-1 mt-1">
                <Info size={10} />
                Stripe erstellt automatisch eine Testphase. Der Kunde wird erst nach Ablauf belastet.
              </p>
            </div>
          )}

          {/* Free product info */}
          {Number(formData.price) === 0 && (
            <div className="mt-4 bg-[#00FF00]/5 border border-[#00FF00]/10 rounded-xl p-4">
              <p className="text-zinc-400 text-xs leading-relaxed">
                <strong className="text-[#00FF00]">Kostenloses Produkt:</strong> Kein Stripe-Checkout erforderlich. Der Zugang wird direkt nach dem "Kauf" freigeschaltet. Ideal für Probe-Pläne, Lead-Magneten oder Bonus-Inhalte.
              </p>
            </div>
          )}
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

        {/* SECTION 6b: 1:1 Coaching Konfiguration */}
        {formData.type === 'COACHING_1ON1' && (
          <section className="bg-[#1C1C1E] border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
                <Users size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">1:1 Coaching Einstellungen</h2>
                <p className="text-xs text-zinc-500">Spezifische Konfiguration für das persönliche Coaching</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Coaching Duration */}
              <div>
                <label className="text-zinc-400 text-sm block mb-1">Coaching-Dauer</label>
                <select
                  value={(formData as any).coachingDurationWeeks || ''}
                  onChange={e => setFormData(prev => ({ ...prev, coachingDurationWeeks: e.target.value ? Number(e.target.value) : undefined } as any))}
                  className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm"
                >
                  <option value="">Laufend (Abo)</option>
                  <option value="4">4 Wochen</option>
                  <option value="8">8 Wochen</option>
                  <option value="12">12 Wochen</option>
                  <option value="16">16 Wochen</option>
                  <option value="24">24 Wochen</option>
                </select>
              </div>

              {/* Sessions per Week */}
              <div>
                <label className="text-zinc-400 text-sm block mb-1">Sessions / Woche</label>
                <select
                  value={(formData as any).sessionsPerWeek || 3}
                  onChange={e => setFormData(prev => ({ ...prev, sessionsPerWeek: Number(e.target.value) } as any))}
                  className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm"
                >
                  {[1,2,3,4,5,6,7].map(n => (
                    <option key={n} value={n}>{n}x pro Woche</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Intake-Fragebogen Section */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden mb-4">
              <div className="flex items-center justify-between p-3 bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <ClipboardList size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Intake-Fragebogen</p>
                    <p className="text-zinc-500 text-xs">Athlet füllt nach Kauf einen Fragebogen aus</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, intakeFormEnabled: !(prev as any).intakeFormEnabled } as any))}
                  className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${(formData as any).intakeFormEnabled ? 'bg-[#00FF00]' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${(formData as any).intakeFormEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {(formData as any).intakeFormEnabled && (
                <div className="p-3 space-y-3 border-t border-zinc-800">
                  <div>
                    <label className="text-zinc-400 text-xs block mb-1">Fragebogen auswählen</label>
                    <select
                      value={(formData as any).intakeFormId || ''}
                      onChange={e => setFormData(prev => ({ ...prev, intakeFormId: e.target.value || null } as any))}
                      className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm"
                    >
                      <option value="">— Keinen Fragebogen zuweisen —</option>
                      {intakeForms.map(f => (
                        <option key={f.id} value={f.id}>{f.title} ({f.questions?.length || 0} Fragen)</option>
                      ))}
                    </select>
                  </div>
                  {intakeForms.length === 0 && (
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-zinc-500 text-xs mb-2">Noch keine Fragebögen erstellt</p>
                      <button
                        type="button"
                        onClick={() => navigate('/intake-forms')}
                        className="text-xs text-[#00FF00] hover:text-[#00FF00]/80 font-bold inline-flex items-center gap-1"
                      >
                        <Plus size={12} /> Fragebogen erstellen
                      </button>
                    </div>
                  )}
                  {intakeForms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate('/intake-forms')}
                      className="text-xs text-zinc-500 hover:text-[#00FF00] flex items-center gap-1"
                    >
                      <ClipboardList size={12} /> Alle Fragebögen verwalten
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Default Coach (optional) */}
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Standard-Coach (optional)</label>
              <select
                value={(formData as any).defaultCoachId || ''}
                onChange={e => setFormData(prev => ({ ...prev, defaultCoachId: e.target.value || undefined } as any))}
                className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm"
              >
                <option value="">Admin entscheidet nach Kauf</option>
                {allCalendars.map((cal: any) => {
                  const p = cal.profiles;
                  const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email : 'Coach';
                  return (
                    <option key={cal.coach_id} value={cal.coach_id}>{name}</option>
                  );
                }).filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.key === v.key) === i)}
              </select>
              <p className="text-zinc-600 text-xs mt-1">Wird automatisch als Coach zugewiesen, wenn gesetzt.</p>
            </div>
          </section>
        )}

        {/* SECTION 7: Kalender-Zuordnung */}
        {(formData.type === 'COACHING_1ON1') && (
          <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
                <Calendar size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Terminkalender</h2>
                <p className="text-xs text-zinc-500">Kalender für Vorabgespräche und 1:1 Termine zuordnen</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mb-3">Mehrere Kalender zuweisen, um den Workload auf verschiedene Coaches zu verteilen.</p>
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {coachCalendars.map(cal => {
                const isSelected = selectedCalendarIds.includes(cal.id);
                return (
                  <label key={cal.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'border-[#00FF00]/50 bg-[#00FF00]/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}>
                    <input type="checkbox" checked={isSelected} onChange={() => {
                      setSelectedCalendarIds(prev => isSelected ? prev.filter(id => id !== cal.id) : [...prev, cal.id]);
                    }} className="accent-[#00FF00] w-4 h-4" />
                    <div className="flex-1">
                      <span className="text-white text-sm font-medium">{cal.name}</span>
                      <span className="text-zinc-500 text-xs ml-2">{cal.slot_duration_minutes} Min · {cal.coach_id === user?.id ? 'Dein Kalender' : 'Coach'}</span>
                    </div>
                    {isSelected && <span className="text-[10px] font-bold text-[#00FF00] bg-[#00FF00]/10 px-2 py-0.5 rounded">Aktiv</span>}
                  </label>
                );
              })}
            </div>
            {selectedCalendarIds.length > 1 && (
              <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-2">
                <Info size={14} className="text-blue-400 shrink-0" />
                <p className="text-xs text-blue-300">
                  <strong>{selectedCalendarIds.length} Kalender</strong> zugewiesen — Termine werden automatisch auf verfügbare Coaches verteilt.
                </p>
              </div>
            )}
            {coachCalendars.length === 0 && (
              <p className="text-xs text-amber-400 mt-2">Erstelle zuerst einen Kalender unter "Terminkalender" in der Navigation.</p>
            )}
          </section>
        )}

        {/* SECTION 8: Chat-Zugang */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.hasChatAccess ? 'bg-purple-500/10' : 'bg-zinc-800'}`}>
                {formData.hasChatAccess 
                  ? <Sparkles size={20} className="text-purple-400" /> 
                  : <Info size={20} className="text-zinc-500" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Chat-Zugang</h2>
                <p className="text-xs text-zinc-500">
                  {formData.hasChatAccess 
                    ? 'Käufer können direkt mit dem Coach chatten' 
                    : 'Kein Chat-Zugang für Käufer dieses Produkts'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, hasChatAccess: !formData.hasChatAccess})}
              className={`relative w-14 h-8 rounded-full transition-colors ${formData.hasChatAccess ? 'bg-purple-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${formData.hasChatAccess ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {formData.type === 'COACHING_1ON1' && !formData.hasChatAccess && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                Bei 1:1 Coaching wird empfohlen, den Chat-Zugang zu aktivieren.
              </p>
            </div>
          )}
        </section>

        {/* SECTION 9: Vorabgespräch */}
        <section className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.requiresConsultation ? 'bg-orange-500/10' : 'bg-zinc-800'}`}>
                {formData.requiresConsultation
                  ? <MessageSquare size={20} className="text-orange-400" />
                  : <MessageSquare size={20} className="text-zinc-500" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Vorabgespräch erforderlich</h2>
                <p className="text-xs text-zinc-500">
                  {formData.requiresConsultation
                    ? 'Käufer müssen vor dem Kauf ein Gespräch buchen'
                    : 'Kein Vorabgespräch nötig — direkter Kauf möglich'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, requiresConsultation: !formData.requiresConsultation})}
              className={`relative w-14 h-8 rounded-full transition-colors ${formData.requiresConsultation ? 'bg-orange-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${formData.requiresConsultation ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Consultation Calendar Config — only when enabled */}
          {formData.requiresConsultation && (
            <div className="mt-6 space-y-5 pt-5 border-t border-zinc-800">
              {/* Calendar Mode */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Welche Kalender für Vorabgespräche?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, consultationCalendarMode: 'all'})}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.consultationCalendarMode === 'all'
                        ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20'
                        : 'bg-[#121212] border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users size={20} className={formData.consultationCalendarMode === 'all' ? 'text-orange-400' : 'text-zinc-500'} />
                      <div>
                        <span className={`text-sm font-bold block ${formData.consultationCalendarMode === 'all' ? 'text-orange-400' : 'text-white'}`}>
                          Alle verfügbaren
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">Alle Coaches/Admins mit Kalender</span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, consultationCalendarMode: 'selected'})}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.consultationCalendarMode === 'selected'
                        ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20'
                        : 'bg-[#121212] border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className={formData.consultationCalendarMode === 'selected' ? 'text-orange-400' : 'text-zinc-500'} />
                      <div>
                        <span className={`text-sm font-bold block ${formData.consultationCalendarMode === 'selected' ? 'text-orange-400' : 'text-white'}`}>
                          Bestimmte auswählen
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">Nur ausgewählte Coaches</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Calendar Picker (only when mode = selected) */}
              {formData.consultationCalendarMode === 'selected' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                    Kalender auswählen <span className="text-zinc-600 normal-case">(Mehrfachauswahl)</span>
                  </label>
                  {allCalendars.length > 0 ? (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
                      {allCalendars.map(cal => {
                        const isSelected = consultationCalendarIds.includes(cal.id);
                        const profile = cal.profiles;
                        const ownerName = profile
                          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.nickname || 'Coach'
                          : (cal.coach_id === user?.id ? 'Du' : 'Coach');
                        const roleBadge = profile?.role === 'ADMIN' ? 'Admin' : 'Coach';
                        return (
                          <label key={cal.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setConsultationCalendarIds(prev =>
                                  isSelected ? prev.filter(id => id !== cal.id) : [...prev, cal.id]
                                );
                              }}
                              className="accent-orange-500 w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-medium">{cal.name}</span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  roleBadge === 'Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>{roleBadge}</span>
                              </div>
                              <span className="text-zinc-500 text-xs block mt-0.5">
                                {ownerName} · {cal.slot_duration_minutes || 30} Min
                              </span>
                            </div>
                            {isSelected && <CheckCircle size={18} className="text-orange-400 shrink-0" />}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-400 flex items-center gap-1 py-3">
                      <AlertCircle size={12} /> Keine Kalender verfügbar. Erstelle zuerst einen Kalender.
                    </p>
                  )}
                  {consultationCalendarIds.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center gap-2">
                      <Info size={14} className="text-orange-400 shrink-0" />
                      <p className="text-xs text-orange-300">
                        <strong>{consultationCalendarIds.length} Kalender</strong> ausgewählt — Athleten können bei diesen Coaches ein Vorabgespräch buchen.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Info when mode = all */}
              {formData.consultationCalendarMode === 'all' && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center gap-2">
                  <Info size={14} className="text-orange-400 shrink-0" />
                  <p className="text-xs text-orange-300">
                    Alle {allCalendars.length} verfügbaren Kalender von Coaches und Admins werden für Vorabgespräche angeboten.
                  </p>
                </div>
              )}
            </div>
          )}
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

      {/* Price Change Checklist Modal */}
      {showPriceChangeWarning && editingProduct && (
        <PriceChangeChecklist
          isOpen={showPriceChangeWarning}
          onClose={() => {
            setShowPriceChangeWarning(false);
            setPendingFormSubmit(null);
          }}
          onConfirm={() => {
            if (pendingFormSubmit) {
              handleSave(pendingFormSubmit);
            }
          }}
          changeType={
            editingProduct.price !== formData.price 
              ? (Number(formData.price) > Number(editingProduct.price) ? 'price_increase' : 'price_decrease')
              : editingProduct.interval !== formData.interval
                ? 'interval_change'
                : 'name_change'
          }
          oldValue={
            editingProduct.price !== formData.price 
              ? `${editingProduct.price} ${editingProduct.currency}`
              : editingProduct.interval !== formData.interval
                ? editingProduct.interval || ''
                : editingProduct.title || ''
          }
          newValue={
            editingProduct.price !== formData.price 
              ? `${formData.price} ${formData.currency}`
              : editingProduct.interval !== formData.interval
                ? formData.interval || ''
                : formData.title || ''
          }
          productTitle={editingProduct.title || ''}
          hasActiveSubscriptions={formData.interval !== 'onetime'}
        />
      )}
    </div>
  );
};

export default AdminProducts;
// Note: ConfirmActionModal is rendered in both list and edit views
