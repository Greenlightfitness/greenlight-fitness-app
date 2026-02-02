import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Calculator, Activity, Heart, Scale, TrendingUp } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { 
    calculateE1RM, 
    calculateRelativeStrength, 
    calculateFFMI, 
    calculateWHtR, 
    calculateRMR, 
    calculateTDEE, 
    calculateKarvonen, 
    calculateACWR, 
    getAge, 
    PAL_OPTIONS 
} from '../utils/formulas';

interface CalculatorsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CalculatorsModal: React.FC<CalculatorsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'strength'|'body'|'metabolism'|'cardio'|'load'>('strength');

    // -- STRENGTH --
    const [e1rmInputs, setE1rmInputs] = useState({ weight: 0, reps: 0 });
    const e1rmResult = calculateE1RM(e1rmInputs.weight, e1rmInputs.reps);
    const relStrength = calculateRelativeStrength(e1rmResult, userProfile?.weight || 75);

    // -- BODY --
    const [bodyInputs, setBodyInputs] = useState({ 
        weight: userProfile?.weight || 0, 
        height: userProfile?.height || 0, 
        bodyFat: userProfile?.bodyFat || 0,
        waist: userProfile?.waistCircumference || 0 
    });
    const ffmi = calculateFFMI(bodyInputs.weight, bodyInputs.height, bodyInputs.bodyFat);
    const whtr = calculateWHtR(bodyInputs.waist, bodyInputs.height);

    // -- METABOLISM --
    const [metaInputs, setMetaInputs] = useState({
        weight: userProfile?.weight || 0,
        height: userProfile?.height || 0,
        age: userProfile?.birthDate ? getAge(userProfile.birthDate) : 25,
        gender: userProfile?.gender || 'male',
        pal: 1.55
    });
    const rmr = calculateRMR(metaInputs.weight, metaInputs.height, metaInputs.age, metaInputs.gender as any);
    const tdee = calculateTDEE(rmr, metaInputs.pal);

    // -- CARDIO --
    const [cardioInputs, setCardioInputs] = useState({
        maxHr: userProfile?.maxHeartRate || 190,
        restingHr: userProfile?.restingHeartRate || 60
    });
    const zones = [0.5, 0.6, 0.7, 0.8, 0.9].map(int => ({
        int,
        bpm: calculateKarvonen(cardioInputs.maxHr, cardioInputs.restingHr, int)
    }));

    // -- LOAD --
    const [loadInputs, setLoadInputs] = useState({ acute: 1000, chronic: 800 });
    const acwr = calculateACWR(loadInputs.acute, loadInputs.chronic);

    if (!isOpen) return null;

    const TabButton = ({ id, label, icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 py-2 px-1 flex-1 border-b-2 transition-colors ${
                activeTab === id ? 'border-[#00FF00] text-[#00FF00]' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
        >
            {icon}
            <span className="text-[10px] uppercase font-bold">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Calculator size={20} className="text-[#00FF00]" /> {t('tools.title')}</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                </div>

                <div className="flex border-b border-zinc-800 bg-zinc-950/50">
                    <TabButton id="strength" label={t('tools.strength')} icon={<Scale size={16}/>} />
                    <TabButton id="body" label={t('tools.body')} icon={<Activity size={16}/>} />
                    <TabButton id="metabolism" label="Metabolism" icon={<TrendingUp size={16}/>} />
                    <TabButton id="cardio" label={t('tools.cardio')} icon={<Heart size={16}/>} />
                    <TabButton id="load" label={t('tools.load')} icon={<Activity size={16}/>} />
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* --- STRENGTH --- */}
                    {activeTab === 'strength' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[#00FF00] font-bold text-sm uppercase tracking-wider mb-1">{t('tools.e1rmTitle')}</h4>
                                <p className="text-xs text-zinc-500 mb-4">{t('tools.e1rmDesc')}</p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Input label={t('editor.metric_weight')} type="number" value={e1rmInputs.weight || ''} onChange={e => setE1rmInputs({...e1rmInputs, weight: Number(e.target.value)})} />
                                    <Input label={t('editor.metric_reps')} type="number" value={e1rmInputs.reps || ''} onChange={e => setE1rmInputs({...e1rmInputs, reps: Number(e.target.value)})} />
                                </div>
                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex justify-between items-center">
                                    <span className="text-zinc-400">Estimated 1RM:</span>
                                    <span className="text-2xl font-bold text-white">{e1rmResult} kg</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm mb-2">Relative Strength Ratio</h4>
                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex justify-between items-center">
                                    <span className="text-zinc-400">Based on {userProfile?.weight}kg BW:</span>
                                    <span className="text-xl font-bold text-[#00FF00]">{relStrength}x</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- BODY --- */}
                    {activeTab === 'body' && (
                         <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label={t('onboarding.weight')} type="number" value={bodyInputs.weight} onChange={e => setBodyInputs({...bodyInputs, weight: Number(e.target.value)})} />
                                <Input label={t('onboarding.height')} type="number" value={bodyInputs.height} onChange={e => setBodyInputs({...bodyInputs, height: Number(e.target.value)})} />
                                <Input label={t('onboarding.bodyFat')} type="number" value={bodyInputs.bodyFat} onChange={e => setBodyInputs({...bodyInputs, bodyFat: Number(e.target.value)})} />
                                <Input label={t('onboarding.waist')} type="number" value={bodyInputs.waist} onChange={e => setBodyInputs({...bodyInputs, waist: Number(e.target.value)})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                                    <h5 className="text-xs text-zinc-500 font-bold uppercase mb-1">{t('tools.ffmiTitle')}</h5>
                                    <div className="text-2xl font-bold text-white">{ffmi}</div>
                                    <div className="text-xs text-zinc-600 mt-1">{ffmi > 22 ? 'Excellent' : 'Average'}</div>
                                </div>
                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                                    <h5 className="text-xs text-zinc-500 font-bold uppercase mb-1">{t('tools.whtrTitle')}</h5>
                                    <div className={`text-2xl font-bold ${whtr > 0.5 ? 'text-red-400' : 'text-[#00FF00]'}`}>{whtr}</div>
                                    <div className="text-xs text-zinc-600 mt-1">{whtr > 0.5 ? 'Risk Area' : 'Healthy'}</div>
                                </div>
                            </div>
                         </div>
                    )}

                    {/* --- METABOLISM --- */}
                    {activeTab === 'metabolism' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Age" type="number" value={metaInputs.age} onChange={e => setMetaInputs({...metaInputs, age: Number(e.target.value)})} />
                                <div className="flex flex-col gap-1 mb-4">
                                    <label className="text-sm font-medium text-zinc-400">{t('onboarding.gender')}</label>
                                    <select 
                                        value={metaInputs.gender} 
                                        onChange={e => setMetaInputs({...metaInputs, gender: e.target.value as any})}
                                        className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 focus:border-[#00FF00]"
                                    >
                                        <option value="male">{t('common.male')}</option>
                                        <option value="female">{t('common.female')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <label className="text-sm font-medium text-zinc-400">{t('tools.pal')}</label>
                                <select 
                                    value={metaInputs.pal} 
                                    onChange={e => setMetaInputs({...metaInputs, pal: Number(e.target.value)})}
                                    className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 focus:border-[#00FF00]"
                                >
                                    {PAL_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-4">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-400">BMR (Resting):</span>
                                    <span className="text-xl font-bold text-white">{rmr} kcal</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400">TDEE (Daily):</span>
                                    <span className="text-2xl font-bold text-[#00FF00]">{tdee} kcal</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CARDIO --- */}
                    {activeTab === 'cardio' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label={t('onboarding.maxHr')} type="number" value={cardioInputs.maxHr} onChange={e => setCardioInputs({...cardioInputs, maxHr: Number(e.target.value)})} />
                                <Input label={t('onboarding.restingHr')} type="number" value={cardioInputs.restingHr} onChange={e => setCardioInputs({...cardioInputs, restingHr: Number(e.target.value)})} />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[#00FF00] font-bold text-sm uppercase tracking-wider mb-2">{t('tools.karvonenTitle')}</h4>
                                {zones.map((z, i) => (
                                    <div key={i} className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800">
                                        <span className="text-zinc-400 font-medium">Zone {i+1} ({(z.int * 100).toFixed(0)}%)</span>
                                        <span className="text-white font-bold">{z.bpm} bpm</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- LOAD --- */}
                    {activeTab === 'load' && (
                        <div className="space-y-6">
                            <p className="text-xs text-zinc-500">{t('tools.acwrDesc')}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Acute Load (7d Avg)" type="number" value={loadInputs.acute} onChange={e => setLoadInputs({...loadInputs, acute: Number(e.target.value)})} />
                                <Input label="Chronic Load (28d Avg)" type="number" value={loadInputs.chronic} onChange={e => setLoadInputs({...loadInputs, chronic: Number(e.target.value)})} />
                            </div>

                            <div className="bg-zinc-950 p-6 rounded border border-zinc-800 text-center">
                                <div className="text-4xl font-bold text-white mb-2">{acwr}</div>
                                <div className={`inline-block px-3 py-1 rounded font-bold text-sm ${
                                    acwr >= 0.8 && acwr <= 1.3 ? 'bg-green-500/20 text-green-500' :
                                    acwr > 1.5 ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                                }`}>
                                    {acwr >= 0.8 && acwr <= 1.3 ? 'Sweet Spot (Safe)' :
                                     acwr > 1.5 ? 'Danger Zone (High Risk)' : 'Review Load'}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CalculatorsModal;