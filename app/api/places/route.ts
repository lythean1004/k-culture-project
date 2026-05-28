import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const category = searchParams.get('category');

  // Place list query stub
  return NextResponse.json({
    success: true,
    data: [
      { id: "place-1", name: "Gyeongbokgung Palace", category: "attraction", city: city || "Seoul" },
      { id: "place-2", name: "National Museum of Korea", category: "museum", city: city || "Seoul" }
    ]
  });
}
