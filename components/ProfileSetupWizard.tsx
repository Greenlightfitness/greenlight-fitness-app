import React, { useState } from 'react';
import { updateProfile } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from './Button';
import Input from './Input';
import { User, Activity, ArrowRight, Check, ChevronRight, HeartPulse } from 'lucide-react';

interface ProfileSetupWizardProps {
  onComplete: () => void;
}

const ProfileSetupWizard: React.FC<ProfileSetupWizardProps> = ({ onComplete }) => {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    nickname: userProfile?.nickname || '',
    height: userProfile?.height || '',
    weight: userProfile?.weight || '',
    bodyFat: userProfile?.bodyFat || '',
    birthDate: userProfile?.birthDate || '',
    gender: userProfile?.gender || 'male',
    waistCircumference: userProfile?.waistCircumference || '',
    restingHeartRate: userProfile?.restingHeartRate || '',
    maxHeartRate: userProfile?.maxHeartRate || ''
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        nickname: formData.nickname,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        body_fat: formData.bodyFat ? Number(formData.bodyFat) : null,
        waist_circumference: formData.waistCircumference ? Number(formData.waistCircumference) : null,
        resting_heart_rate: formData.restingHeartRate ? Number(formData.restingHeartRate) : null,
        max_heart_rate: formData.maxHeartRate ? Number(formData.maxHeartRate) : null,
        birth_date: formData.birthDate,
        gender: formData.gender,
        onboarding_completed: true
      });
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
      if (!user) return;
      try {
          await updateProfile(user.id, { onboarding_completed: true });
      } catch (e) { console.error(e) }
      onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-[#00FF00]' : 'bg-zinc-800'}`}></div>
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-[#00FF00]' : 'bg-zinc-800'}`}></div>
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-[#00FF00]' : 'bg-zinc-800'}`}></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <p className="text-zinc-400">
            {t('onboarding.welcome')}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-[#00FF00]">
                <User size={20} />
                <span className="font-bold uppercase tracking-wider text-sm">{t('onboarding.nameStep')}</span>
              </div>
              
              <Input 
                label={t('onboarding.firstName')}
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                placeholder="Jane"
              />
              <Input 
                label={t('onboarding.lastName')}
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                placeholder="Doe"
              />
              <Input 
                label={t('onboarding.nickname')}
                value={formData.nickname}
                onChange={e => setFormData({...formData, nickname: e.target.value})}
                placeholder="J-Doe (Optional)"
              />

              <div className="pt-4">
                <Button fullWidth onClick={() => setStep(2)} className="flex justify-between items-center group">
                  {t('common.next')} <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-[#00FF00]">
                <Activity size={20} />
                <span className="font-bold uppercase tracking-wider text-sm">{t('onboarding.statsStep')}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input 
                    label={t('onboarding.height')}
                    type="number"
                    value={formData.height}
                    onChange={e => setFormData({...formData, height: e.target.value})}
                    placeholder="180"
                />
                <Input 
                    label={t('onboarding.weight')}
                    type="number"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                    placeholder="75"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label={t('onboarding.bodyFat')}
                    type="number"
                    value={formData.bodyFat}
                    onChange={e => setFormData({...formData, bodyFat: e.target.value})}
                    placeholder="15"
                  />
                   <Input 
                    label={t('onboarding.waist')}
                    type="number"
                    value={formData.waistCircumference}
                    onChange={e => setFormData({...formData, waistCircumference: e.target.value})}
                    placeholder="80"
                  />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>
                    {t('common.back')}
                </Button>
                <Button fullWidth onClick={() => setStep(3)} className="flex justify-between items-center group">
                  {t('common.next')} <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-[#00FF00]">
                <HeartPulse size={20} />
                <span className="font-bold uppercase tracking-wider text-sm">{t('onboarding.bioStep')}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 mb-4">
                      <label className="text-sm font-medium text-zinc-400">{t('onboarding.gender')}</label>
                      <select 
                        value={formData.gender} 
                        onChange={e => setFormData({...formData, gender: e.target.value as any})}
                        className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]"
                      >
                          <option value="male">{t('common.male')}</option>
                          <option value="female">{t('common.female')}</option>
                      </select>
                  </div>
                  <Input 
                    label={t('onboarding.birthDate')}
                    type="date"
                    value={formData.birthDate}
                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input 
                    label={t('onboarding.restingHr')}
                    type="number"
                    value={formData.restingHeartRate}
                    onChange={e => setFormData({...formData, restingHeartRate: e.target.value})}
                    placeholder="60"
                />
                <Input 
                    label={t('onboarding.maxHr')}
                    type="number"
                    value={formData.maxHeartRate}
                    onChange={e => setFormData({...formData, maxHeartRate: e.target.value})}
                    placeholder="190"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)}>
                    {t('common.back')}
                </Button>
                <Button fullWidth onClick={handleSave} disabled={loading} className="flex justify-center items-center gap-2">
                  {loading ? t('onboarding.settingUp') : (
                      <>
                        {t('common.finish')} <Check size={18} />
                      </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <button 
            onClick={handleSkip} 
            className="w-full mt-6 text-zinc-500 text-sm hover:text-white transition-colors underline"
        >
            {t('common.skip')}
        </button>

      </div>
    </div>
  );
};

export default ProfileSetupWizard;