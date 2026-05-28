import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  // Event list query stub
  return NextResponse.json({
    success: true,
    data: [
      { id: "event-1", title: "Royal Guard Changing Ceremony", type: "performance", city: city || "Seoul" }
    ]
  });
}
