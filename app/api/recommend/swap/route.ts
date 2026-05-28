import { NextRequest } from 'next/server';
import { findSwapCandidates } from '../../../../lib/recommend/swap';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');
    const itemIndexStr = searchParams.get('itemIndex');
    const hint = searchParams.get('hint') || undefined;

    if (!packageId || !itemIndexStr) {
      return Response.json({ success: false, error: 'packageId and itemIndex are required' }, { status: 400 });
    }

    const itemIndex = parseInt(itemIndexStr, 10);
    const candidates = await findSwapCandidates(packageId, itemIndex, hint);

    return Response.json({ success: true, data: candidates });
  } catch (error: any) {
    console.error('[Swap API] Error fetching swap candidates:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
