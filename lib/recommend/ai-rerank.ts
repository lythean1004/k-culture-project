import { isFeatureFlagEnabled } from './candidates';
import { ScoredCandidate, RecommendInput } from './types';

export async function aiRerank(
  scored: ScoredCandidate[],
  input: RecommendInput
): Promise<ScoredCandidate[]> {
  const flagEnabled = await isFeatureFlagEnabled('ai_rerank');
  if (!flagEnabled) return scored;
  
  const aiBoostWeight = 0.1;  // Adjust deterministic scores within 10%
  
  return scored.map(c => {
    const similarity = c.semanticSimilarity ?? 0;
    const boost = similarity * 10 * aiBoostWeight;
    
    return {
      ...c,
      score: {
        ...c.score,
        total: c.score.total + boost,
      }
    };
  }).sort((a, b) => b.score.total - a.score.total);
}
