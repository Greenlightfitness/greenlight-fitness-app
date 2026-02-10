
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, getExercises, createExercise, updateExercise, deleteExercise, getUsersByRoles, getActiveSubscription, getCoachingRelationship } from '../services/supabase';
import { Exercise, INITIAL_EXERCISES, UserRole, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Search, Dumbbell, Trash2, Pencil, Box, Video, Layers, X, Archive, Undo2, ShieldCheck, User, Lock, Zap, Crown } from 'lucide-react';

const ATHLETE_FREE_EXERCISE_LIMIT = 5;

const Exercises: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [filterMode, setFilterMode] = useState<'ALL' | 'SYSTEM' | 'COACH'>('ALL');
  const { t } = useLanguage();
  
  // Cache for user profiles to show names
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Athlete-specific: Check if user is athlete and count their exercises
  const isAthlete = userProfile?.role === UserRole.ATHLETE;
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    const checkPremium = async () => {
      if (!user) return;
      try {
        const [subscription, coaching] = await Promise.all([
          getActiveSubscription(user.id).catch(() => null),
          getCoachingRelationship(user.id).catch(() => null),
        ]);
        setHasPremium(!!(subscription || coaching));
      } catch { setHasPremium(false); }
    };
    checkPremium();
  }, [user]);
  
  const myExerciseCount = useMemo(() => {
    if (!isAthlete || !user) return 0;
    return exercises.filter(ex => ex.authorId === user.id && !ex.isArchived).length;
  }, [exercises, user, isAthlete]);

  const canCreateExercise = !isAthlete || hasPremium || myExerciseCount < ATHLETE_FREE_EXERCISE_LIMIT;

  // Lightbox State
  const [viewImage, setViewImage] = useState<{ url: string; title: string } | null>(null);

  // Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: ''
  });

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const data = await getExercises();
      const fetched: Exercise[] = data.map((ex: any) => ({
        id: ex.id,
        authorId: ex.author_id,
        authorRole: ex.author_role,
        name: ex.name,
        description: ex.description,
        category: ex.category,
        difficulty: ex.difficulty,
        trackingType: ex.tracking_type,
        videoUrl: ex.video_url,
        thumbnailUrl: ex.thumbnail_url,
        sequenceUrl: ex.sequence_url,
        defaultSets: ex.default_sets,
        defaultVisibleMetrics: ex.default_visible_metrics,
        isArchived: ex.is_archived,
        isPublic: ex.is_public,
      }));
      setExercises(fetched);
      
      // Fetch Author Profiles if Admin
      if (userProfile?.role === UserRole.ADMIN) {
        const profiles = await getUsersByRoles([UserRole.ADMIN, UserRole.COACH]);
        const map: Record<string, UserProfile> = {};
        profiles.forEach((p: any) => {
          map[p.id] = {
            uid: p.id,
            email: p.email,
            role: p.role,
            firstName: p.first_name,
            lastName: p.last_name,
          } as UserProfile;
        });
        setUserMap(map);
      }

    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [userProfile]);

  // --- SEEDING ---
  const handleSeedData = async () => {
    if (!window.confirm(t('exercises.seedConfirm'))) return;
    try {
      setLoading(true);
      const promises = INITIAL_EXERCISES.map(ex => createExercise({
        author_id: user?.id,
        name: ex.name,
        description: ex.description,
        category: ex.category,
        difficulty: ex.difficulty || 'Beginner',
        is_archived: false,
      }));
      await Promise.all(promises);
      await fetchExercises();
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  // --- ACTIONS ---
  const handleOpenCreate = () => {
    if (!canCreateExercise) {
      setShowPremiumModal(true);
      return;
    }
    setExerciseToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (ex: Exercise) => {
    setExerciseToEdit(ex);
    setIsEditorOpen(true);
  };

  const handleEditorSave = () => {
    fetchExercises(); // Refresh list after save
  };

  const toggleArchiveStatus = async (ex: Exercise, shouldArchive: boolean) => {
    try {
      await updateExercise(ex.id, { is_archived: shouldArchive });
      
      // Optimistic Update
      setExercises(exercises.map(e => 
        e.id === ex.id ? { ...e, isArchived: shouldArchive } : e
      ));
    } catch (error) {
      console.error("Error updating archive status:", error);
    }
  };

  const requestDelete = (ex: Exercise) => {
    setDeleteConfirm({ isOpen: true, id: ex.id, name: ex.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    
    try {
      await deleteExercise(deleteConfirm.id);
      setExercises(exercises.filter(ex => ex.id !== deleteConfirm.id));
    } catch (error) {
      console.error("Error deleting exercise:", error);
    } finally {
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    }
  };

  // Filter Logic
  const filteredExercises = exercises.filter(ex => {
    // 1. Filter by Search
    const matchesSearch = 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ex.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Filter by View Mode (Active vs Archived)
    const isArchived = !!ex.isArchived;
    const matchesView = viewMode === 'active' ? !isArchived : isArchived;

    // 3. Role-based visibility
    let matchesRoleFilter = true;
    
    // Athletes see: public exercises OR their own exercises
    if (isAthlete) {
      matchesRoleFilter = ex.isPublic !== false || ex.authorId === user?.id;
    }
    
    // 4. Admin Filter (only for admin view)
    let matchesAdminFilter = true;
    if (userProfile?.role === UserRole.ADMIN) {
        if (filterMode === 'SYSTEM') {
            const author = userMap[ex.authorId || ''];
            matchesAdminFilter = author?.role === UserRole.ADMIN || ex.authorId === user?.uid;
        } else if (filterMode === 'COACH') {
            const author = userMap[ex.authorId || ''];
            matchesAdminFilter = author?.role !== UserRole.ADMIN && ex.authorId !== user?.uid;
        }
    }

    return matchesSearch && matchesView && matchesRoleFilter && matchesAdminFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        title={t('exercises.deleteConfirmTitle')}
        message={t('exercises.deleteConfirmMessage', { name: deleteConfirm.name })}
        isDangerous={true}
        confirmText={t('common.yesDeletePerm')}
        cancelText={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
      />

      <ExerciseEditorModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        exerciseToEdit={exerciseToEdit}
        onSave={handleEditorSave}
      />

      {/* Lightbox for Motion Sequence */}
      {viewImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setViewImage(null)}
        >
            <button className="absolute top-6 right-6 text-white hover:text-[#00FF00] transition-colors bg-zinc-800 p-2 rounded-full">
                <X size={24} />
            </button>
            <div className="max-w-lg w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <img 
                    src={viewImage.url} 
                    alt={viewImage.title} 
                    className="max-h-[80vh] w-auto rounded-lg border border-zinc-800 shadow-2xl object-contain bg-zinc-900" 
                />
                <h3 className="text-white font-bold mt-6 text-xl tracking-tight">{viewImage.title}</h3>
                <p className="text-zinc-500 text-sm uppercase tracking-widest mt-1">{t('exercises.motionSequence')}</p>
            </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('exercises.title')}</h1>
          <p className="text-zinc-400 mt-2 max-w-md text-lg">{t('exercises.subtitle')}</p>
          {/* Athlete exercise limit indicator */}
          {isAthlete && !hasPremium && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${myExerciseCount >= ATHLETE_FREE_EXERCISE_LIMIT ? 'bg-orange-500' : 'bg-[#00FF00]'}`}
                  style={{ width: `${Math.min(100, (myExerciseCount / ATHLETE_FREE_EXERCISE_LIMIT) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                {myExerciseCount}/{ATHLETE_FREE_EXERCISE_LIMIT} eigene Übungen
              </span>
              {myExerciseCount >= ATHLETE_FREE_EXERCISE_LIMIT && (
                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Limit erreicht</span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {exercises.length === 0 && !loading && !isAthlete && (
             <Button variant="secondary" onClick={handleSeedData}>{t('exercises.loadSample')}</Button>
          )}
          <Button onClick={handleOpenCreate} className="flex items-center justify-center gap-2 h-12 px-6 text-base w-full md:w-auto rounded-xl">
            <Plus size={20} /> {isAthlete ? 'Eigene Übung' : t('exercises.addExercise')}
          </Button>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1C1C1E] p-2 rounded-2xl border border-zinc-800">
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {/* Custom Tabs */}
              <div className="flex bg-zinc-900 p-1 rounded-xl shrink-0">
                <button 
                  onClick={() => setViewMode('active')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    viewMode === 'active' 
                      ? 'bg-[#00FF00] text-black shadow-lg' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {t('exercises.activeLibrary')}
                </button>
                <button 
                   onClick={() => setViewMode('archived')}
                   className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    viewMode === 'archived' 
                      ? 'bg-zinc-700 text-white shadow-lg' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Archive size={14} /> {t('exercises.archived')}
                </button>
              </div>

              {/* Admin Filters */}
              {userProfile?.role === UserRole.ADMIN && (
                  <div className="flex bg-zinc-900 p-1 rounded-xl shrink-0">
                      <button 
                        onClick={() => setFilterMode('ALL')} 
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'ALL' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                      >
                          ALL
                      </button>
                      <button 
                        onClick={() => setFilterMode('SYSTEM')} 
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filterMode === 'SYSTEM' ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                      >
                          <ShieldCheck size={12}/> SYS
                      </button>
                      <button 
                        onClick={() => setFilterMode('COACH')} 
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filterMode === 'COACH' ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                      >
                          <User size={12}/> COACH
                      </button>
                  </div>
              )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder={t('exercises.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-transparent rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-600 focus:bg-zinc-950 focus:border-[#00FF00] focus:outline-none transition-all"
            />
          </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#00FF00] border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => {
            // Determine authorship visual
            const isMe = ex.authorId === user?.uid;
            const authorProfile = userMap[ex.authorId || ''];
            const isAdminAuthor = authorProfile?.role === UserRole.ADMIN || (isMe && userProfile?.role === UserRole.ADMIN);

            return (
            <div 
                key={ex.id} 
                className="bg-[#1C1C1E] border border-zinc-800 p-5 rounded-[1.5rem] flex flex-col gap-4 hover:border-[#00FF00]/40 transition-all group shadow-sm hover:shadow-xl relative overflow-hidden"
            >
                {/* Admin Attribution Badge */}
                {userProfile?.role === UserRole.ADMIN && (
                    <div className="absolute top-4 right-4 z-10">
                        {isAdminAuthor ? (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 shadow-sm">
                                <ShieldCheck size={10} /> System
                            </span>
                        ) : (
                            <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm">
                                {authorProfile?.firstName || "Coach"}
                            </span>
                        )}
                    </div>
                )}

                {/* Visual Header */}
                <div className="flex items-start gap-4">
                     <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                        {ex.thumbnailUrl ? (
                            <img src={ex.thumbnailUrl} alt={ex.name} className="w-full h-full object-cover" />
                        ) : (
                            <Dumbbell size={28} className="text-zinc-700" />
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">{ex.category}</span>
                        </div>
                        <h3 className="font-bold text-lg text-white leading-tight truncate pr-2 group-hover:text-[#00FF00] transition-colors">{ex.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-black ${
                                ex.difficulty === 'Advanced' ? 'bg-red-500' : 
                                ex.difficulty === 'Intermediate' ? 'bg-yellow-500' : 
                                'bg-[#00FF00]'
                            }`}>
                                {ex.difficulty || 'Beginner'}
                            </span>
                        </div>
                     </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 mt-auto border-t border-zinc-800 flex items-center justify-between">
                    <div className="flex gap-1">
                         {ex.videoUrl && (
                            <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-[#00FF00] hover:bg-zinc-800 transition-colors" title={t('exercises.viewVideo')}>
                                <Video size={14} />
                            </a>
                         )}
                         {ex.sequenceUrl && (
                            <button onClick={() => setViewImage({ url: ex.sequenceUrl!, title: ex.name })} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-[#00FF00] hover:bg-zinc-800 transition-colors" title={t('exercises.motionSequence')}>
                                <Layers size={14} />
                            </button>
                         )}
                    </div>

                    <div className="flex items-center gap-2">
                        {viewMode === 'active' ? (
                            <>
                                <button onClick={() => handleOpenEdit(ex)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-300 hover:bg-white hover:text-black transition-colors">
                                    {t('common.edit')}
                                </button>
                                <button onClick={() => toggleArchiveStatus(ex, true)} className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-orange-400 transition-colors">
                                    <Archive size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => toggleArchiveStatus(ex, false)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-[#00FF00] hover:bg-[#00FF00] hover:text-black transition-colors flex items-center gap-1">
                                    <Undo2 size={12} /> {t('exercises.restore')}
                                </button>
                                <button onClick={() => requestDelete(ex)} className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
          )})
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-800 rounded-[2rem] bg-[#1C1C1E]/30">
             <Dumbbell size={48} className="text-zinc-700 mb-4" />
             <p className="text-zinc-500 font-medium">
                {viewMode === 'active' 
                    ? t('exercises.noExercises') 
                    : t('exercises.noArchived')}
             </p>
          </div>
        )}
      </div>

      {/* Premium Modal for Athletes */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#1C1C1E] to-black border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl my-4">
            {/* Hero Section */}
            <div className="relative p-6 pb-4 text-center bg-gradient-to-b from-[#00FF00]/10 to-transparent">
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#00FF00]/20 to-[#00FF00]/5 rounded-2xl flex items-center justify-center border border-[#00FF00]/30 shadow-[0_0_30px_rgba(0,255,0,0.2)]">
                  <Dumbbell size={28} className="text-[#00FF00]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Mehr Übungen freischalten</h2>
                <p className="text-zinc-400 text-sm">Du hast {myExerciseCount} von {ATHLETE_FREE_EXERCISE_LIMIT} kostenlosen Übungen erstellt</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-3">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00FF00] to-[#00FF00]/70 rounded-full"
                  style={{ width: `${(myExerciseCount / ATHLETE_FREE_EXERCISE_LIMIT) * 100}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1 text-center">{myExerciseCount}/{ATHLETE_FREE_EXERCISE_LIMIT} kostenlos</p>
            </div>

            {/* Benefits */}
            <div className="px-5 py-3">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">Mit Premium erhältst du</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Unbegrenzte Übungen</p>
                    <p className="text-xs text-zinc-500">Erstelle so viele eigene Übungen wie du willst</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <Zap size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">KI-generierte Bilder</p>
                    <p className="text-xs text-zinc-500">Automatische Illustrationen für deine Übungen</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <Crown size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Alle Premium-Features</p>
                    <p className="text-xs text-zinc-500">Analytics, PR-Tracking, Volumen-Charts & mehr</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="p-5 pt-2 space-y-3">
              <div className="bg-gradient-to-r from-[#00FF00]/10 to-transparent p-3 rounded-xl border border-[#00FF00]/20">
                <p className="text-[10px] text-zinc-400 mb-0.5">Schalte alles frei mit einem</p>
                <p className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-[#00FF00]">Premium</span> Paket
                </p>
              </div>

              <button 
                onClick={() => {
                  setShowPremiumModal(false);
                  window.location.href = '/shop';
                }}
                className="w-full py-3.5 bg-[#00FF00] text-black font-bold rounded-xl text-base shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all active:scale-[0.98]"
              >
                Pakete ansehen
              </button>
              
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="w-full py-2 text-zinc-500 text-sm hover:text-white transition-colors"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exercises;