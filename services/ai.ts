import { GoogleGenAI } from "@google/genai";

export const generateExerciseIllustration = async (exerciseName: string, description: string): Promise<string | null> => {
  // Initialize client inside the function to ensure process.env.API_KEY is up to date
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      Create a realistic, high-quality fitness illustration of the exercise: "${exerciseName}".
      
      Visual Style Requirements:
      1. Vibe: Special Forces / Tactical Fitness / Underground Gym.
      2. Background: Pitch black or dark minimalist training space.
      3. Subject: A fit, hard, well-trained male athlete with a tactical/hardened look.
      4. Equipment: High-end, matte black equipment.
      5. Lighting: Dramatic, cinematic lighting (rim lighting).
      6. Accents: Use Green (#00FF00) strictly for UI elements like motion arrows or subtle highlights on gear.
      7. Action: Show the movement execution clearly, potentially as a sequence or a single dynamic pose.
      8. Aspect Ratio: 16:9.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
        },
      },
    });

    // Extract the image from the response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Gemini AI Image Generation Error:", error);
    throw error;
  }
};

export const generateExerciseDescription = async (exerciseName: string, currentDescription?: string): Promise<string | null> => {
    // Initialize client inside the function to ensure process.env.API_KEY is up to date
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const prompt = `
            Act as an elite strength and conditioning coach with a Special Forces background. 
            Write a technical, concise description for the exercise: "${exerciseName}".
            ${currentDescription ? `Use this existing input as context but improve it: "${currentDescription}"` : ''}
            
            Requirements:
            1. Focus on correct execution cues, proper form, and target muscles.
            2. Tone: Direct, professional, no fluff, "Special Forces" precision.
            3. Output Format: Provide the description in two languages. First in English, then in German. Separate them with a newline.
            
            Example Output:
            [EN] English description text...
            
            [DE] Deutsche Beschreibung...
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] }
        });

        return response.text || null;
    } catch (error) {
        console.error("Gemini AI Text Generation Error:", error);
        throw error;
    }
};

export const generateExerciseSequence = async (exerciseName: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      Create a vertical step-by-step instructional illustration for the exercise: "${exerciseName}".
      
      Requirements:
      1. Layout: 3 frames arranged VERTICALLY (Top to Bottom).
      2. Content:
         - Top: Starting position.
         - Middle: Movement execution (mid-point).
         - Bottom: End position.
      3. Style: Technical fitness illustration, high contrast.
      4. Palette: Solid Black background (#000000), White outlines/subject, Neon Green (#00FF00) motion arrows and highlights.
      5. Aesthetic: Special Forces / Tactical manual style.
      6. Aspect Ratio: 9:16 (Portrait).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "9:16",
            imageSize: "1K"
        },
      },
    });

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    console.warn("AI Response did not contain inlineData image.");
    return null;
  } catch (error) {
    console.error("Gemini AI Sequence Generation Error:", error);
    throw error;
  }
};