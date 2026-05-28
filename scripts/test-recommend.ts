import { ofetch } from 'ofetch';

async function main() {
  console.log('Testing Recommendation API via Node.js fetch...');
  try {
    const res = await ofetch('http://localhost:3000/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        cityCode: 'seoul',
        visitForm: 'DAY_TRIP',
        interests: ['HISTORY', 'TRADITIONAL_MUSIC'],
        lang: 'en',
        transportMode: 'TRANSIT',
      },
    });
    console.log('Recommendation API returned packages count:', res.packages?.length);
    console.log('Sample Package details:');
    console.log(JSON.stringify(res.packages?.[0], null, 2));
  } catch (error: any) {
    console.error('API Test request failed:', error.message);
    console.error('Error Details:', JSON.stringify(error.data, null, 2));
  }
}

main();
