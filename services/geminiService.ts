
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  generateRayanMood: async (totalDebts: number) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `O Rayan é o dono das Guaravitas. No momento, as pessoas devem um total de ${totalDebts} Guaravitas para ele. 
        Gere uma frase curta e engraçada (em português) sobre o humor do Rayan hoje baseado nessa dívida. 
        Se a dívida for alta, ele está bravo. Se for baixa, ele está quase perdoando (mas não totalmente).
        Mantenha um tom informal e carioca.`,
      });
      return response.text || "Rayan está de olho nas suas Guaravitas...";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "O Rayan está sem palavras com tanta dívida.";
    }
  }
};
