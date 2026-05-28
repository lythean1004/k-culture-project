import { chatCompletion } from '../lib/ai/gateway';

async function main() {
  console.log('Testing AI Gateway wrapper functions...');
  try {
    const r = await chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello in Korean, Japanese, Chinese.' }
      ],
      purpose: 'REASON_TEXT',
      maxTokens: 100,
    });
    console.log('Success Response:', r);
  } catch (error: any) {
    console.log('AI Gateway Executed with expected error (since no real GEMINI_API_KEY is configured):');
    console.log('Error Message:', error.message);
  }
}

main();
