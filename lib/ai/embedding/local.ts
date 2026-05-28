import { EmbeddingRequest, EmbeddingResponse } from './types';

export class LocalEmbedding {
  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error('Local embedding not yet configured');
  }
}
