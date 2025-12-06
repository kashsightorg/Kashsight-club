import { GoogleGenAI } from "@google/genai";

// Lazy initialization to prevent runtime crash if process.env is malformed at module load time
let aiClient: GoogleGenAI | null = null;

const getAI = () => {
    if (!aiClient) {
        // Safe fallback to empty string to ensure constructor doesn't throw synchronously during init
        const apiKey = process.env.API_KEY || '';
        aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
}

export const getBusinessAdvice = async (history: string, query: string): Promise<string> => {
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `
          You are "Mwalimu AI", a wise and practical business coach for the Kenyan 'Jua Kali' (informal) sector.
          
          Your expertise:
          - Physical trades: Carpentry, Welding, Tailoring, Mechanics, Salon/Beauty, Farming.
          - Local context: You understand the Kenyan market, 'Kanjo' (local council), sourcing materials locally.
          - Tone: Encouraging, practical, uses simple English mixed with popular local business terms.
          - Avoid: Generic online skills (like dropshipping or graphic design). Focus on tangible businesses.
          
          User is asking: "${query}"
          
          Conversation History:
          ${history}
          
          Provide short, actionable advice.
        `;
    
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        
        return response.text || "network error, try again.";
      } catch (error) {
        console.error("Gemini Error:", error);
        return "I'm having trouble connecting to the network right now.";
      }
}