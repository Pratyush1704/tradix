import { NextResponse } from 'next/server';

export async function GET(request) {
    return NextResponse.json(
        { detail: 'Ticker symbol is required. Use /api/historical-data/{ticker}' },
        { status: 400 }
    );
}
