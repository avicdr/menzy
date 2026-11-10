import { GoogleGenAI } from '@google/genai';

let genAIClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'mock-gemini-key') {
    return null;
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      apiVersion: process.env.GEMINI_API_VERSION || 'v1beta',
    });
  }

  return genAIClient;
}

const DEPRECATED_OR_STALLING_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
]);

export const DEFAULT_GEMINI_TEXT_MODEL = 'gemini-3-flash-preview';

export function getTextModelName(): string {
  const configured = process.env.GEMINI_TEXT_MODEL?.trim();
  if (!configured || DEPRECATED_OR_STALLING_MODELS.has(configured)) {
    return DEFAULT_GEMINI_TEXT_MODEL;
  }
  return configured;
}

export function getImageModelName(): string {
  return process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';
}

