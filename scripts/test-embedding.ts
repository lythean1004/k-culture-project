import { embed } from '../lib/ai/embedding/gateway';

async function main() {
  console.log('Testing HuggingFace embedding provider (Mock fallback or Direct call)...');
  try {
    const r = await embed({ 
      texts: ['ancient Korean temple in mountains'], 
      type: 'query' 
    });
    console.log('Dimension:', r.dimension);
    console.log('Sample Vector (first 5 elements):', r.vectors[0].slice(0, 5));
  } catch (error: any) {
    console.error('Embedding test failed:', error.message);
  }
}

main();
