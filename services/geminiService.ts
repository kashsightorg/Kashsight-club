
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
          You are "Mwalimu", a wise and practical business coach for the Kenyan 'Jua Kali' (informal) sector.
          
          Your expertise:
          - Physical trades: Carpentry, Welding, Tailoring, Mechanics, Salon/Beauty, Farming.
          - Local context: You understand the Kenyan market, 'Kanjo' (local council), sourcing materials locally.
          - Tone: Encouraging, practical, uses simple English mixed with popular local business terms.
          - Avoid: Generic online skills (like dropshipping or graphic design). Focus on tangible businesses.
          - Identity: Do not refer to yourself as an AI. You are a coach, a mentor, or simply "Mwalimu".
          
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

export const generateResourceContent = async (title: string, type: string, description: string): Promise<string> => {
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `
            Act as a professional business consultant for the African market.
            Generate a detailed ${type} titled "${title}".
            Context: ${description}
            
            Structure the content clearly with:
            1. Executive Summary
            2. Key Steps / Strategies
            3. Actionable Checklist
            4. Local Implementation Tips (Kenya/Nigeria/South Africa context)
            
            Keep it text-based and formatted for a PDF document. Do not use Markdown symbols like ** or #, just clean plain text with spacing.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        return response.text || "Failed to generate content.";
    } catch (error) {
        console.error("Gemini Gen Error:", error);
        return "Error generating resource content.";
    }
}

export const generateCurriculum = async (courseTitle: string): Promise<{title: string, task: string}[]> => {
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `
            Generate 5 practical subtopics (modules) for a vocational course titled: "${courseTitle}".
            Focus on the 'Jua Kali' (informal) sector in Africa.
            
            Return ONLY valid JSON in this format:
            [
              {"title": "Module Title", "task": "A short practical task for the student"}
            ]
        `;
        
        const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json' } });
        return JSON.parse(response.text || '[]');
    } catch (e) {
        console.error("Curriculum Gen Error", e);
        return [];
    }
}

export const generateLesson = async (courseTitle: string, moduleTitle: string): Promise<{content: string, quizQuestion: string, quizOptions: string[], quizAnswer: string}> => {
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `
            Generate a short, practical lesson for the module "${moduleTitle}" in the course "${courseTitle}".
            The content should be about 200 words, practical, and easy to read.
            Also provide a simple multiple choice quiz question.
            
            Return ONLY valid JSON in this format:
            {
                "content": "The lesson text...",
                "quizQuestion": "Question?",
                "quizOptions": ["Option A", "Option B", "Option C", "Option D"],
                "quizAnswer": "Option A"
            }
        `;
        const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json' } });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Lesson Gen Error", e);
        return { content: "Error loading lesson.", quizQuestion: "", quizOptions: [], quizAnswer: "" };
    }
}
