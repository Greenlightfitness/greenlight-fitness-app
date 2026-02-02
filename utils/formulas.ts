
/**
 * Greenlight Fitness - Sports Science Formula Library
 */

// --- 1. KRAFT & HYPERTROPHIE ---

/**
 * Calculates Estimated 1 Rep Max (Brzycki Formula)
 * @param weight Weight lifted in kg
 * @param reps Repetitions performed
 * @returns Estimated 1RM in kg
 */
export const calculateE1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps === 0) return 0;
    // Formula: Weight / (1.0278 - (0.0278 * Reps))
    const e1rm = weight / (1.0278 - (0.0278 * reps));
    return Math.round(e1rm * 10) / 10; // Round to 1 decimal
};

/**
 * Calculates Relative Strength Ratio
 * @param e1rm Estimated 1RM in kg
 * @param bodyWeight Body weight in kg
 * @returns Ratio (e.g., 1.5x bodyweight)
 */
export const calculateRelativeStrength = (e1rm: number, bodyWeight: number): number => {
    if (!bodyWeight || bodyWeight === 0) return 0;
    return Math.round((e1rm / bodyWeight) * 100) / 100;
};

/**
 * Calculates Volume Load (Tonnage) for a set
 * @param weight Weight in kg
 * @param reps Reps performed
 * @param sets Sets performed (defaults to 1 if calculating per set)
 * @returns Total volume in kg
 */
export const calculateVolumeLoad = (weight: number, reps: number, sets: number = 1): number => {
    return weight * reps * sets;
};


// --- 2. KÖRPERZUSAMMENSETZUNG ---

/**
 * Calculates Fat-Free Mass Index (FFMI)
 * @param weight Weight in kg
 * @param heightCm Height in cm
 * @param bodyFat Body Fat percentage (0-100)
 * @returns FFMI score
 */
export const calculateFFMI = (weight: number, heightCm: number, bodyFat: number): number => {
    if (!heightCm || heightCm === 0) return 0;
    const heightM = heightCm / 100;
    const leanMass = weight * (1 - (bodyFat / 100));
    const ffmi = leanMass / (heightM * heightM);
    // Normalized FFMI for height (optional, using basic here)
    return Math.round(ffmi * 10) / 10;
};

/**
 * Calculates Waist-to-Height Ratio (WHtR)
 * @param waist Waist circumference in cm
 * @param height Height in cm
 * @returns Ratio
 */
export const calculateWHtR = (waist: number, height: number): number => {
    if (!height || height === 0) return 0;
    return Math.round((waist / height) * 100) / 100;
};


// --- 3. STOFFWECHSEL & ENERGIE ---

/**
 * Calculates Resting Metabolic Rate (RMR) using Mifflin-St. Jeor
 * @param weight kg
 * @param height cm
 * @param age years
 * @param gender 'male' | 'female'
 * @returns kcal/day
 */
export const calculateRMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
    // Basic: (10 * weight) + (6.25 * height) - (5 * age) + s
    // s is +5 for males, -161 for females
    let s = gender === 'male' ? 5 : -161;
    const rmr = (10 * weight) + (6.25 * height) - (5 * age) + s;
    return Math.round(rmr);
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE)
 * @param rmr Resting Metabolic Rate
 * @param pal Physical Activity Level (1.2 to 2.4)
 * @returns kcal/day
 */
export const calculateTDEE = (rmr: number, pal: number): number => {
    return Math.round(rmr * pal);
};


// --- 4. AUSDAUER & HERZ ---

/**
 * Calculates Target Heart Rate (Karvonen)
 * @param maxHr Maximum Heart Rate
 * @param restingHr Resting Heart Rate
 * @param intensity Intensity percentage (0.0 - 1.0) e.g., 0.7 for 70%
 * @returns Target BPM
 */
export const calculateKarvonen = (maxHr: number, restingHr: number, intensity: number): number => {
    // Formula: ((Max - Rest) * Intensity) + Rest
    return Math.round(((maxHr - restingHr) * intensity) + restingHr);
};

/**
 * Calculates Heart Rate Recovery Score
 * @param peakHr HR at end of exercise
 * @param recoveryHr HR after 1 minute rest
 * @returns Score (drop in bpm)
 */
export const calculateRecoveryScore = (peakHr: number, recoveryHr: number): number => {
    return peakHr - recoveryHr;
};


// --- 5. BELASTUNGSSTEUERUNG ---

/**
 * Calculates Acute:Chronic Workload Ratio (ACWR)
 * @param acuteLoad Average load of last 7 days
 * @param chronicLoad Average load of last 28 days
 * @returns Ratio
 */
export const calculateACWR = (acuteLoad: number, chronicLoad: number): number => {
    if (chronicLoad === 0) return 0;
    return Math.round((acuteLoad / chronicLoad) * 100) / 100;
};

// --- HELPER: GET AGE FROM BIRTHDATE ---
export const getAge = (birthDateString: string): number => {
    if(!birthDateString) return 25; // Default fallback
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const PAL_OPTIONS = [
    { value: 1.2, label: 'Sedentary (Office job, little exercise)' },
    { value: 1.375, label: 'Light (Exercise 1-3 days/week)' },
    { value: 1.55, label: 'Moderate (Exercise 3-5 days/week)' },
    { value: 1.725, label: 'Active (Exercise 6-7 days/week)' },
    { value: 1.9, label: 'Very Active (Physical job + training)' },
];
