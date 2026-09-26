import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appId = String(
    process.env.PRIVY_APP_ID ||
    process.env.NEXT_PUBLIC_PRIVY_APP_ID ||
    ''
  ).trim();

  if (!appId) {
    return NextResponse.json(
      { error: 'Privy app is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    { appId },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    }
  );
}
