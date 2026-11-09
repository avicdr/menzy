import { GoogleGenAI } from '@google/genai';

let genAIClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'mock-gemini-key') {
    return null;
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }

  return genAIClient;
}

export function getTextModelName(): string {
  return process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
}

export function getImageModelName(): string {
  return process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';
}
