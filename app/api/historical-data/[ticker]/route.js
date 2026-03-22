import { NextResponse } from 'next/server';

export async function GET(request, props) {
    try {
        const resolvedParams = await props.params;
        const ticker = resolvedParams.ticker;
        const FASTAPI_URL = process.env.FASTAPI_URL;
        const res = await fetch(`${FASTAPI_URL}/historical-data/${ticker}`);
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ detail: 'Failed to fetch historical data' }, { status: 500 });
    }
}
