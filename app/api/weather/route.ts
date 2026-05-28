import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Seoul';

  // Weather api proxy stub (calling KMA API in actual implementation)
  return NextResponse.json({
    success: true,
    data: {
      city,
      temp: 24,
      condition: "Clear",
      humidity: 50,
      timestamp: new Date().toISOString()
    }
  });
}
