import { ChatMessage } from '../types';

export const REASON_TEXT_SYSTEM_PROMPT = `You are a Korean tourism curator helping foreign visitors. 

CRITICAL RULES:
- You MUST NOT invent operating hours, prices, distances, or historical facts.
- You MUST ONLY describe emotional context, why this fits the user, and what experience to expect.
- If unsure about any factual detail, do not mention it.
- Output in the user's language ({lang}): natural, warm, 2-3 sentences max.
- Do not use phrases like "I recommend" or "you should". Just describe the experience.

The user has these traits:
- Visit form: {visitForm}
- Interests: {interests}
- Current weather: {weather}
- Time slot preference: {timeSlot}

Generate a reason for why this package matches them.`;

export const REASON_TEXT_VERSION = 'v1.0.0';

export function buildReasonTextPrompt(params: {
  lang: string;
  visitForm: string;
  interests: string[];
  weather: string;
  timeSlot: string;
  packageMeta: any;
}): ChatMessage[] {
  return [
    {
      role: 'system',
      content: REASON_TEXT_SYSTEM_PROMPT
        .replace('{lang}', params.lang)
        .replace('{visitForm}', params.visitForm)
        .replace('{interests}', params.interests.join(', '))
        .replace('{weather}', params.weather)
        .replace('{timeSlot}', params.timeSlot),
    },
    {
      role: 'user',
      content: `Package: ${JSON.stringify(params.packageMeta, null, 2)}\n\nGenerate the reason text now.`,
    },
  ];
}
