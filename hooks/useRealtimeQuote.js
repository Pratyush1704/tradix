import { useEffect } from 'react';

export function useRealtimeQuote(ticker, setQuote) {
    useEffect(() => {
        if (!ticker) return;

        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
        const ws = new WebSocket(WS_URL);
        const upperTicker = ticker.toUpperCase();

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', symbol: upperTicker }));
        };

        ws.onmessage = async (event) => {
            try {
                let message = event.data;
                if (message instanceof Blob) {
                    message = await message.text();
                }
                const data = JSON.parse(message);
                const quotePayload = Array.isArray(data.data) ? data.data[0] : null;

                if (quotePayload && quotePayload.s === upperTicker) {
                    setQuote({
                        c: quotePayload.p
                    });
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
        };

        ws.onclose = (e) => {
            console.warn('WebSocket closed:', e.reason || 'Connection lost');
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'unsubscribe', symbol: upperTicker }));
            }
            ws.close();
        };
    }, [ticker, setQuote]);
}