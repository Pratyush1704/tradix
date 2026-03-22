const WebSocket = require('ws');
const http = require('http');

const FINNHUB_WS_URL = process.env.FINNHUB_WS_URL;
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'https://tradix-ai.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];

// Basic health check server
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Create WebSocket server manually (for origin validation)
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
    const origin = req.headers.origin;

    if (!allowedOrigins.includes(origin)) {
        console.warn(`[SECURITY] Blocked WebSocket connection from disallowed origin: ${origin}`);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
    });
});

// Relay logic
wss.on('connection', (client) => {
    console.log('[CLIENT] WebSocket client connected');

    const finnhubWS = new WebSocket(FINNHUB_WS_URL);
    const messageQueue = [];

    const pingInterval = setInterval(() => {
        if (client.readyState === WebSocket.OPEN) {
            client.ping();
        }
    }, 30000);

    // Finnhub connection opened
    finnhubWS.on('open', () => {
        console.log('[FINNHUB] Connected to Finnhub WebSocket');
        while (messageQueue.length > 0 && finnhubWS.readyState === WebSocket.OPEN) {
            const msg = messageQueue.shift();
            finnhubWS.send(msg);
            console.log('[QUEUE] Flushed to Finnhub:', msg);
        }
    });

    // Forward data from Finnhub to client
    finnhubWS.on('message', (data) => {
        if (client.readyState === WebSocket.OPEN) {
            const message = Buffer.isBuffer(data) ? data.toString('utf8') : data;
            console.log('[FINNHUB] Received:', message);
            client.send(message);
        }
    });

    // Handle client messages (subscribe/unsubscribe)
    client.on('message', (msg) => {
        try {
            console.log('[CLIENT] Sent:', msg);
            const { type, symbol } = JSON.parse(msg);

            if (type && symbol) {
                const message = JSON.stringify({ type, symbol });

                if (finnhubWS.readyState === WebSocket.OPEN) {
                    finnhubWS.send(message);
                    console.log('[FINNHUB] Sent:', message);
                } else {
                    messageQueue.push(message);
                    console.log('[QUEUE] Queued for Finnhub:', message);
                }
            }
        } catch (error) {
            console.error('[CLIENT] Invalid message format:', error.message);
        }
    });

    client.on('close', () => {
        console.log('[CLIENT] Disconnected');
        clearInterval(pingInterval);
        finnhubWS.close();
    });

    finnhubWS.on('close', () => {
        console.log('[FINNHUB] Disconnected');
        clearInterval(pingInterval);
        if (client.readyState === WebSocket.OPEN) {
            client.close();
        }
    });

    finnhubWS.on('error', (err) => {
        console.error('[FINNHUB] Error:', err.message);
    });

    client.on('error', (err) => {
        console.error('[CLIENT] Error:', err.message);
    });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`[SERVER] WebSocket relay server running on port ${PORT}`);
});