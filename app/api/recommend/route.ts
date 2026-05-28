import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Recommendation engine stub
    return NextResponse.json({
      success: true,
      data: {
        theme: "Heritage & Art Walk",
        city: body.city || "Seoul",
        places: [
          { id: "place-1", name: "Gyeongbokgung Palace", lat: 37.5796, lng: 126.9770 },
          { id: "place-2", name: "National Museum of Korea", lat: 37.5240, lng: 126.9804 }
        ],
        events: [
          { id: "event-1", title: "Royal Guard Changing Ceremony" }
        ]
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
