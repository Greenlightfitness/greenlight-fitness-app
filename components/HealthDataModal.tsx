import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/supabase';
import { X, Heart, Scale, Activity, TrendingUp, Ruler, Percent, Edit2, Check, Calculator } from 'lucide-react';
import Input from './Input';
import { 
    calculateFFMI, 
    calculateWHtR, 
    calculateRMR, 
    calculateTDEE, 
    calculateKarvonen, 
    getAge, 
    PAL_OPTIONS 
} from '../utils/formulas';

interface HealthDataModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HealthDataModal: React.FC<HealthDataModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { user, userProfile, refreshProfile } = useAuth();
    const [activeSection, setActiveSection] = useState<'overview' | 'calculators'>('overview');
    const [editingField, setEditingField] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Editable biometric data
    const [formData, setFormData] = useState({
        weight: userProfile?.weight || 0,
        height: userProfile?.height || 0,
        bodyFat: userProfile?.bodyFat || 0,
        waistCircumference: userProfile?.waistCircumference || 0,
        restingHeartRate: userProfile?.restingHeartRate || 60,
        maxHeartRate: userProfile?.maxHeartRate || 190,
    });

    // Update form data when userProfile changes
    useEffect(() => {
        if (userProfile) {
            setFormData({
                weight: userProfile.weight || 0,
                height: userProfile.height || 0,
                bodyFat: userProfile.bodyFat || 0,
                waistCircumference: userProfile.waistCircumference || 0,
                restingHeartRate: userProfile.restingHeartRate || 60,
                maxHeartRate: userProfile.maxHeartRate || 190,
            });
        }
    }, [userProfile]);

    // Auto-calculated values
    const age = userProfile?.birthDate ? getAge(userProfile.birthDate) : 25;
    const gender = userProfile?.gender || 'male';
    
    const ffmi = formData.weight && formData.height && formData.bodyFat 
        ? calculateFFMI(formData.weight, formData.height, formData.bodyFat) 
        : null;
    
    const whtr = formData.waistCircumference && formData.height 
        ? calculateWHtR(formData.waistCircumference, formData.height) 
        : null;
    
    const rmr = formData.weight && formData.height 
        ? calculateRMR(formData.weight, formData.height, age, gender as 'male' | 'female') 
        : null;
    
    const tdee = rmr ? calculateTDEE(rmr, 1.55) : null; // Default moderate activity
    
    const hrZones = formData.maxHeartRate && formData.restingHeartRate 
        ? [0.5, 0.6, 0.7, 0.8, 0.9].map(int => ({
            zone: Math.round(int * 10) - 4,
            intensity: int,
            bpm: calculateKarvonen(formData.maxHeartRate, formData.restingHeartRate, int)
        }))
        : [];

    const handleSaveField = async (field: string) => {
        if (!user) return;
        setSaving(true);
        
        try {
            const updates: any = {};
            switch (field) {
                case 'weight': updates.weight = formData.weight; break;
                case 'height': updates.height = formData.height; break;
                case 'bodyFat': updates.body_fat = formData.bodyFat; break;
                case 'waistCircumference': updates.waist_circumference = formData.waistCircumference; break;
                case 'restingHeartRate': updates.resting_heart_rate = formData.restingHeartRate; break;
                case 'maxHeartRate': updates.max_heart_rate = formData.maxHeartRate; break;
            }
            
            await updateProfile(user.id, updates);
            await refreshProfile();
            setEditingField(null);
        } catch (error) {
            console.error('Error saving field:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const DataCard = ({ 
        label, 
        value, 
        unit, 
        field, 
        icon: Icon,
        color = 'text-[#00FF00]'
    }: { 
        label: string; 
        value: number; 
        unit: string; 
        field: string;
        icon: any;
        color?: string;
    }) => {
        const isEditing = editingField === field;
        
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 relative group">
                <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} className={color} />
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                </div>
                
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={formData[field as keyof typeof formData] || ''}
                            onChange={e => setFormData({ ...formData, [field]: Number(e.target.value) })}
                            className="bg-black border border-[#00FF00] text-white text-2xl font-bold w-24 px-2 py-1 rounded focus:outline-none"
                            autoFocus
                        />
                        <span className="text-zinc-500">{unit}</span>
                        <button 
                            onClick={() => handleSaveField(field)}
                            disabled={saving}
                            className="ml-auto p-2 bg-[#00FF00] text-black rounded-lg hover:bg-[#00FF00]/80 disabled:opacity-50"
                        >
                            <Check size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-baseline justify-between">
                        <div>
                            <span className="text-2xl font-bold text-white">{value || '–'}</span>
                            <span className="text-zinc-500 ml-1">{unit}</span>
                        </div>
                        <button 
                            onClick={() => setEditingField(field)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-[#00FF00] transition-all"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const CalculatedValue = ({ 
        label, 
        value, 
        unit,
        status,
        statusColor
    }: { 
        label: string; 
        value: string | number | null; 
        unit?: string;
        status?: string;
        statusColor?: string;
    }) => (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#00FF00]">{value ?? '–'}</span>
                {unit && <span className="text-zinc-500">{unit}</span>}
            </div>
            {status && (
                <div className={`text-xs mt-2 font-medium ${statusColor || 'text-zinc-400'}`}>
                    {status}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                    <div>
                        <h3 className="text-xl font-bold text-white">Meine Gesundheitsdaten</h3>
                        <p className="text-sm text-zinc-500 mt-1">Deine biometrischen Werte & berechnete Metriken</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-zinc-800 px-6">
                    <button 
                        onClick={() => setActiveSection('overview')}
                        className={`py-3 px-4 text-sm font-bold transition-colors border-b-2 ${
                            activeSection === 'overview' 
                                ? 'border-[#00FF00] text-[#00FF00]' 
                                : 'border-transparent text-zinc-500 hover:text-white'
                        }`}
                    >
                        Übersicht
                    </button>
                    <button 
                        onClick={() => setActiveSection('calculators')}
                        className={`py-3 px-4 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                            activeSection === 'calculators' 
                                ? 'border-[#00FF00] text-[#00FF00]' 
                                : 'border-transparent text-zinc-500 hover:text-white'
                        }`}
                    >
                        <Calculator size={14} /> Rechner
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    
                    {activeSection === 'overview' && (
                        <>
                            {/* Biometric Data - Editable */}
                            <div>
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Körperdaten</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <DataCard label="Gewicht" value={formData.weight} unit="kg" field="weight" icon={Scale} />
                                    <DataCard label="Größe" value={formData.height} unit="cm" field="height" icon={Ruler} />
                                    <DataCard label="Körperfett" value={formData.bodyFat} unit="%" field="bodyFat" icon={Percent} />
                                    <DataCard label="Bauchumfang" value={formData.waistCircumference} unit="cm" field="waistCircumference" icon={Activity} />
                                    <DataCard label="Ruhepuls" value={formData.restingHeartRate} unit="bpm" field="restingHeartRate" icon={Heart} color="text-red-400" />
                                    <DataCard label="Max. Herzfrequenz" value={formData.maxHeartRate} unit="bpm" field="maxHeartRate" icon={Heart} color="text-red-400" />
                                </div>
                            </div>

                            {/* Auto-Calculated Values */}
                            <div>
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Berechnete Werte</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <CalculatedValue 
                                        label="FFMI" 
                                        value={ffmi} 
                                        status={ffmi ? (ffmi > 22 ? 'Überdurchschnittlich' : ffmi > 18 ? 'Durchschnitt' : 'Unter Durchschnitt') : undefined}
                                        statusColor={ffmi ? (ffmi > 22 ? 'text-[#00FF00]' : 'text-zinc-400') : undefined}
                                    />
                                    <CalculatedValue 
                                        label="WHtR" 
                                        value={whtr} 
                                        status={whtr ? (whtr > 0.5 ? 'Erhöhtes Risiko' : 'Gesund') : undefined}
                                        statusColor={whtr ? (whtr > 0.5 ? 'text-red-400' : 'text-[#00FF00]') : undefined}
                                    />
                                    <CalculatedValue 
                                        label="Grundumsatz" 
                                        value={rmr} 
                                        unit="kcal"
                                    />
                                    <CalculatedValue 
                                        label="Tagesumsatz" 
                                        value={tdee} 
                                        unit="kcal"
                                        status="Bei moderater Aktivität"
                                    />
                                </div>
                            </div>

                            {/* Heart Rate Zones */}
                            {hrZones.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Herzfrequenz-Zonen</h4>
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-2">
                                        {hrZones.map((zone, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                                        i === 0 ? 'bg-blue-500/20 text-blue-400' :
                                                        i === 1 ? 'bg-green-500/20 text-green-400' :
                                                        i === 2 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        i === 3 ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        Z{zone.zone}
                                                    </div>
                                                    <span className="text-zinc-400 text-sm">{Math.round(zone.intensity * 100)}% Intensität</span>
                                                </div>
                                                <span className="text-white font-bold">{zone.bpm} bpm</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeSection === 'calculators' && (
                        <div className="space-y-6">
                            <p className="text-zinc-400 text-sm">
                                Nutze die Rechner für manuelle Berechnungen mit beliebigen Werten.
                            </p>
                            
                            {/* 1RM Calculator */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                                <h4 className="text-[#00FF00] font-bold text-sm uppercase tracking-wider mb-4">Estimated 1RM Rechner</h4>
                                <E1RMCalculator bodyWeight={formData.weight} />
                            </div>

                            {/* ACWR Calculator */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                                <h4 className="text-[#00FF00] font-bold text-sm uppercase tracking-wider mb-4">ACWR (Trainingsbelastung)</h4>
                                <ACWRCalculator />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Sub-component: 1RM Calculator
const E1RMCalculator = ({ bodyWeight }: { bodyWeight: number }) => {
    const [weight, setWeight] = useState(0);
    const [reps, setReps] = useState(0);
    
    const e1rm = weight && reps ? Math.round(weight * (1 + reps / 30)) : 0;
    const relStrength = e1rm && bodyWeight ? (e1rm / bodyWeight).toFixed(2) : '0';
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Gewicht (kg)</label>
                    <input 
                        type="number" 
                        value={weight || ''} 
                        onChange={e => setWeight(Number(e.target.value))}
                        className="w-full bg-black border border-zinc-700 text-white rounded-lg px-3 py-2 mt-1 focus:border-[#00FF00] outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Wiederholungen</label>
                    <input 
                        type="number" 
                        value={reps || ''} 
                        onChange={e => setReps(Number(e.target.value))}
                        className="w-full bg-black border border-zinc-700 text-white rounded-lg px-3 py-2 mt-1 focus:border-[#00FF00] outline-none"
                    />
                </div>
            </div>
            <div className="flex justify-between items-center bg-black rounded-xl p-4 border border-zinc-800">
                <div>
                    <div className="text-xs text-zinc-500">Geschätztes 1RM</div>
                    <div className="text-2xl font-bold text-white">{e1rm} kg</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-zinc-500">Relative Stärke</div>
                    <div className="text-xl font-bold text-[#00FF00]">{relStrength}x</div>
                </div>
            </div>
        </div>
    );
};

// Sub-component: ACWR Calculator
const ACWRCalculator = () => {
    const [acute, setAcute] = useState(1000);
    const [chronic, setChronic] = useState(800);
    
    const acwr = chronic > 0 ? (acute / chronic).toFixed(2) : '0';
    const acwrNum = parseFloat(acwr);
    
    const getStatus = () => {
        if (acwrNum >= 0.8 && acwrNum <= 1.3) return { text: 'Optimal (Sweet Spot)', color: 'text-[#00FF00]' };
        if (acwrNum > 1.5) return { text: 'Hohes Verletzungsrisiko', color: 'text-red-400' };
        if (acwrNum < 0.8) return { text: 'Unterbelastung', color: 'text-yellow-400' };
        return { text: 'Erhöhtes Risiko', color: 'text-orange-400' };
    };
    
    const status = getStatus();
    
    return (
        <div className="space-y-4">
            <p className="text-xs text-zinc-500">
                Der ACWR vergleicht deine akute (7 Tage) mit chronischer (28 Tage) Trainingsbelastung.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Akute Last (7d)</label>
                    <input 
                        type="number" 
                        value={acute} 
                        onChange={e => setAcute(Number(e.target.value))}
                        className="w-full bg-black border border-zinc-700 text-white rounded-lg px-3 py-2 mt-1 focus:border-[#00FF00] outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Chronische Last (28d)</label>
                    <input 
                        type="number" 
                        value={chronic} 
                        onChange={e => setChronic(Number(e.target.value))}
                        className="w-full bg-black border border-zinc-700 text-white rounded-lg px-3 py-2 mt-1 focus:border-[#00FF00] outline-none"
                    />
                </div>
            </div>
            <div className="bg-black rounded-xl p-6 border border-zinc-800 text-center">
                <div className="text-4xl font-bold text-white mb-2">{acwr}</div>
                <div className={`text-sm font-bold ${status.color}`}>{status.text}</div>
            </div>
        </div>
    );
};

export default HealthDataModal;
