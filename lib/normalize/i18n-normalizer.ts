export type QualityGrade = 'A' | 'B' | 'B_MINUS' | 'C';

export function evaluateTranslationQuality(
  source: string,
  text: string
): QualityGrade {
  if (!text) return 'C';
  
  // Rule-based quality grade evaluation
  if (source === 'OFFICIAL_HUMAN' || source === 'MANUAL_EDITOR') {
    return 'A';
  }
  
  if (source === 'MT_GLOSSARY_AI_POSTEDIT') {
    // Check if the post-edited text has reasonable length and structure
    if (text.length > 5 && !/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)) {
      return 'B';
    }
    return 'B_MINUS';
  }
  
  if (source === 'LLM_GENERATED' || source === 'LLM_LOCAL_QWEN_GENERATED') {
    return 'B_MINUS';
  }
  
  return 'C'; // Default machine translation (MT_GLOSSARY)
}
