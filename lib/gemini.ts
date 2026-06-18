import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getModel() {
  if (!apiKey) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

export async function getCoachAdvice(fen: string, history: string[], difficulty: string): Promise<string | null> {
  const m = getModel();
  if (!m) return null;

  const prompt = `You are a chess coach for a ${difficulty} level player. 
Current position FEN: ${fen}
Move history: ${history.join(' ')}

Give ONE short, actionable tip (max 2 sentences) about what the player should think about in this position. Focus on tactics and strategy. Don't give the exact move.`;

  try {
    const result = await m.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return null;
  }
}

export async function getOpeningInsights(openingName: string): Promise<string | null> {
  const m = getModel();
  if (!m) return null;

  const prompt = `Give one brief tip (max 15 words) about how to play the ${openingName} in chess.`;

  try {
    const result = await m.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return null;
  }
}
