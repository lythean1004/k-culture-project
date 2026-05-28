export interface EmbeddingRequest {
  texts: string[];
  type: 'query' | 'passage';     // e5 모델은 prefix 구분 필요
}

export interface EmbeddingResponse {
  vectors: number[][];
  modelName: string;
  dimension: number;
}
