import { GeminiProvider } from './providers/gemini';
import { VllmProvider } from './providers/vllm';
import { auditLog, checkRateLimit, maskPII } from './governance';
import { ChatCompletionRequest, ChatCompletionResponse } from './types';

const BACKEND = process.env.AI_BACKEND ?? 'gemini';

const provider = BACKEND === 'gemini' 
  ? new GeminiProvider()
  : new VllmProvider();

export async function chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  // 1. Rate limit 체크 (Gemini 분당 15회 등)
  await checkRateLimit(BACKEND);
  
  // 2. PII 마스킹
  const sanitized = maskPII(req);
  
  // 3. 호출
  const startedAt = Date.now();
  let response: ChatCompletionResponse;
  let errorCode: string | null = null;
  
  try {
    response = await provider.chatCompletion(sanitized);
  } catch (e: any) {
    errorCode = e.message || 'Unknown error';
    throw e;
  } finally {
    // 4. Audit 로깅
    await auditLog({
      purpose: req.purpose,
      provider: BACKEND,
      modelName: response!?.modelName ?? 'unknown',
      inputPayload: sanitized,
      output: response! ?? null,
      tokensIn: response!?.tokensIn ?? 0,
      tokensOut: response!?.tokensOut ?? 0,
      latencyMs: Date.now() - startedAt,
      errorCode,
    });
  }
  
  return response;
}
