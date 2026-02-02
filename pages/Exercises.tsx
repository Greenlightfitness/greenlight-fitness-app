
import React, { useEffect, useState } from 'react';
import { supabase, getExercises, createExercise, updateExercise, deleteExercise, getUsersByRoles } from '../services/supabase';
import { Exercise, INITIAL_EXERCISES, UserRole, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Search, Dumbbell, Trash2, Pencil, Box, Video, Layers, X, Archive, Undo2, ShieldCheck, User } from 'lucide-react';

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
        name: ex.name,
        description: ex.description,
        category: ex.category,
        difficulty: ex.difficulty,
        videoUrl: ex.video_url,
        thumbnailUrl: ex.thumbnail_url,
        sequenceUrl: ex.sequence_url,
        defaultSets: ex.default_sets,
        defaultVisibleMetrics: ex.default_visible_metrics,
        isArchived: ex.is_archived,
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

    // 3. Admin Filter
    let matchesFilter = true;
    if (userProfile?.role === UserRole.ADMIN) {
        if (filterMode === 'SYSTEM') {
            // Check if author is admin (simple check: author matches user ID if user is admin, or we rely on map)
            // For now, assuming current User is Admin:
            // "System" means created by an Admin. 
            const author = userMap[ex.authorId || ''];
            matchesFilter = author?.role === UserRole.ADMIN || ex.authorId === user?.uid;
        } else if (filterMode === 'COACH') {
            const author = userMap[ex.authorId || ''];
            matchesFilter = author?.role !== UserRole.ADMIN && ex.authorId !== user?.uid;
        }
    }

    return matchesSearch && matchesView && matchesFilter;
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
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {exercises.length === 0 && !loading && (
             <Button variant="secondary" onClick={handleSeedData}>{t('exercises.loadSample')}</Button>
          )}
          <Button onClick={handleOpenCreate} className="flex items-center justify-center gap-2 h-12 px-6 text-base w-full md:w-auto rounded-xl">
            <Plus size={20} /> {t('exercises.addExercise')}
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
    </div>
  );
};

export default Exercises;