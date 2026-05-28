import { HuggingFaceEmbedding } from './huggingface';
import { LocalEmbedding } from './local';
import { EmbeddingRequest, EmbeddingResponse } from './types';

const BACKEND = process.env.EMBEDDING_BACKEND ?? 'huggingface';

const provider = BACKEND === 'huggingface' 
  ? new HuggingFaceEmbedding() 
  : new LocalEmbedding();

export async function embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
  return provider.embed(req);
}
