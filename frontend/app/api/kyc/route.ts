import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Didit KYC is not connected to the production web runtime yet. Configure the ROBANK backend or a server-side Didit integration first.'
    },
    { status: 503 }
  );
}
