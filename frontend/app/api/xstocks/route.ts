import { NextResponse } from 'next/server';
import { getXStocksCatalog } from '@/lib/xstocksCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const assets = await getXStocksCatalog();
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: assets.length,
      assets,
    }, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'xStocks catalog unavailable' },
      { status: 502 }
    );
  }
}
