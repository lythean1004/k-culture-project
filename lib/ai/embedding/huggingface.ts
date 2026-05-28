import { EmbeddingRequest, EmbeddingResponse } from './types';

const HF_API = 'https://api-inference.huggingface.co/models';
const MODEL = process.env.HF_EMBEDDING_MODEL ?? 'intfloat/multilingual-e5-small';

export class HuggingFaceEmbedding {
  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    const prefix = req.type === 'query' ? 'query: ' : 'passage: ';
    const inputs = req.texts.map(t => prefix + t);
    
    const hfToken = process.env.HF_API_TOKEN || '';
    if (!hfToken) {
      console.warn('[Embedding] HF_API_TOKEN is missing. Returning dummy vectors (384-dim) for testing.');
      const dummyVectors = req.texts.map(() => Array.from({ length: 384 }, () => Math.random() - 0.5));
      return {
        vectors: dummyVectors,
        modelName: MODEL,
        dimension: 384,
      };
    }

    const response = await fetch(`${HF_API}/${MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        inputs,
        options: { wait_for_model: true }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HF embedding failed: ${response.status}`);
    }
    
    const vectors = await response.json();
    
    return {
      vectors,
      modelName: MODEL,
      dimension: vectors[0].length,
    };
  }
}
