import { NextResponse } from 'next/server';

export async function POST(request) {
    const FASTAPI_URL = process.env.FASTAPI_URL;
    try {
        const body = await request.json();
        const res = await fetch(`${FASTAPI_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('[predict] ERROR:', error.message);
        return NextResponse.json({ detail: 'Failed to get prediction', error: error.message }, { status: 500 });
    }
}
