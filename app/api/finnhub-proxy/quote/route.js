import { NextResponse } from 'next/server';

export async function GET(request) {
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

    if (!FINNHUB_API_KEY) {
        return NextResponse.json({ error: 'Server configuration error: Finnhub API Key is missing.' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const ticker = searchParams.get('ticker');

        if (!ticker) {
            return NextResponse.json({ error: 'Ticker symbol is required.' }, { status: 400 });
        }

        const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
        const response = await fetch(finnhubUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            return NextResponse.json(
                { error: `Finnhub API error: ${response.statusText}`, details: errorData.message || 'Unknown error from Finnhub.' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}