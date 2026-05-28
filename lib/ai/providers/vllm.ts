import OpenAI from 'openai';
import { ChatCompletionRequest, ChatCompletionResponse } from '../types';

export class VllmProvider {
  private client: OpenAI;
  private modelName: string;
  
  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.VLLM_BASE_URL ?? 'http://localhost:8000/v1',
      apiKey: process.env.VLLM_API_KEY ?? 'local-dummy',
    });
    this.modelName = process.env.VLLM_MODEL ?? 'Qwen/Qwen2.5-7B-Instruct';
  }
  
  async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startedAt = Date.now();
    
    const completion = await this.client.chat.completions.create({
      model: req.model ?? this.modelName,
      messages: req.messages.map(m => ({
        role: m.role as any,
        content: m.content,
        tool_calls: m.toolCalls?.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
        })),
        tool_call_id: m.toolCallId,
      })),
      temperature: req.temperature ?? 0.3,
      max_tokens: req.maxTokens ?? 500,
      response_format: req.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      tools: req.tools?.map(t => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.parameters as any }
      })),
    });
    
    const choice = completion.choices[0];
    
    return {
      content: choice.message.content ?? '',
      toolCalls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        name: (tc as any).function.name,
        arguments: JSON.parse((tc as any).function.arguments),
      })),
      tokensIn: completion.usage?.prompt_tokens ?? 0,
      tokensOut: completion.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      provider: 'vllm',
      modelName: this.modelName,
    };
  }
}
