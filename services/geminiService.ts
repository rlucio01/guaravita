import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('guaravita_gemini_key') || '';
};

export const geminiService = {
  generateRayanMood: async (totalDebts: number) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return "Rayan está sem palavras... (Configure a API Key no Admin)";
    }

    try {
      const ai = new GoogleGenAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const response = await model.generateContent(`O Rayan é o dono das Guaravitas. No momento, as pessoas devem um total de ${totalDebts} Guaravitas para ele. 
        Gere uma frase curta e engraçada (em português) sobre o humor do Rayan hoje baseado nessa dívida. 
        Se a dívida for alta, ele está bravo. Se for baixa, ele está quase perdoando (mas não totalmente).
        Mantenha um tom informal e carioca.`);

      return response.response.text() || "Rayan está de olho nas suas Guaravitas...";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "O Rayan está sem palavras com tanta dívida.";
    }
  }
};

