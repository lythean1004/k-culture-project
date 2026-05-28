import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatCompletionRequest, ChatCompletionResponse } from '../types';
import crypto from 'crypto';

export class GeminiProvider {
  private client: GoogleGenerativeAI;
  private primaryModel: string;
  private fallbackModel: string;
  
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-api-key');
    this.primaryModel = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-exp';
    this.fallbackModel = process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-1.5-flash-8b';
  }
  
  async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const modelName = req.model ?? this.primaryModel;
    const model = this.client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: req.temperature ?? 0.3,
        maxOutputTokens: req.maxTokens ?? 500,
        responseMimeType: req.responseFormat === 'json' ? 'application/json' : 'text/plain',
        responseSchema: req.jsonSchema as any,
      },
      tools: req.tools ? [{
        functionDeclarations: req.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters as any,
        }))
      }] : undefined,
    });
    
    const systemMessage = req.messages.find(m => m.role === 'system');
    const conversationMessages = req.messages.filter(m => m.role !== 'system');
    
    const history = conversationMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    
    const chat = model.startChat({
      history,
      systemInstruction: systemMessage?.content,
    });
    
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const startedAt = Date.now();
    
    try {
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      
      const functionCalls = response.functionCalls();
      const toolCalls = functionCalls?.map(fc => ({
        id: crypto.randomUUID(),
        name: fc.name,
        arguments: fc.args,
      }));
      
      return {
        content: toolCalls ? '' : response.text(),
        toolCalls,
        tokensIn: response.usageMetadata?.promptTokenCount ?? 0,
        tokensOut: response.usageMetadata?.candidatesTokenCount ?? 0,
        latencyMs: Date.now() - startedAt,
        provider: 'gemini',
        modelName,
      };
    } catch (e: any) {
      if (e.message?.includes('quota') && modelName === this.primaryModel) {
        return this.chatCompletion({ ...req, model: this.fallbackModel });
      }
      throw e;
    }
  }
}
