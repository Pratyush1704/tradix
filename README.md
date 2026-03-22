# Tradix AI – Real-Time Stock Analysis & Prediction

Tradix AI is a full-stack web application that delivers real-time stock quotes, historical data, news, and AI-powered price predictions. It leverages the Finnhub API for live market data and Google Gemini for advanced, actionable market analysis.

---

## Features

- **Real-Time Quotes:**  
  Live price updates for supported tickers using Finnhub WebSocket.

- **Historical Data:**  
  Visualize up to one year of price history.

- **Latest News:**  
  Aggregated, up-to-date news for each ticker.

- **AI-Powered Predictions:**  
  Get next-day and swing price predictions, plus detailed market analysis, powered by Gemini LLM.

- **Sector Awareness:**  
  Contextualizes each stock within its sector and the broader market.

---

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express, WebSocket (ws)
- **APIs:**  
  - [Finnhub](https://finnhub.io/) (real-time & REST stock data)  
  - [Google Gemini](https://ai.google.dev/gemini-api/docs/get-started) (LLM analysis)
- **Other:** FastAPI (for historical data & ML prediction), Vercel (deployment)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tradix-ai.git
cd tradix-ai
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Variables

Create a `.env.local` file in the root with the following:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:4000
FINNHUB_WS_URL=wss://ws.finnhub.io?token=YOUR_FINNHUB_API_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### 4. Start the Servers

**Backend (WebSocket relay):**
```bash
cd tradix-ai/server
node realtime-server.js
```

**Frontend:**
```bash
cd tradix-ai
npm run dev
```

### 5. (Optional) FastAPI ML Server

If using your own ML backend for predictions, start it as well.

---

## Usage

- Search for a stock ticker (e.g., AAPL, TSLA).
- View real-time price, historical chart, and news.
- Click "Predict" to get AI-powered price forecasts and analysis.

---

## Project Structure

```
tradix-ai/
├── components/         # React UI components
├── hooks/              # Custom React hooks (real-time, data fetching)
├── lib/                # API utilities, constants, helpers
├── pages/              # Next.js pages & API routes
├── public/             # Static assets
├── server/             # Node.js WebSocket relay server
└── README.md
```

---

## Notes

- **Finnhub Free Tier:** Real-time data is limited to certain symbols (AAPL, TSLA, etc.).
- **Gemini API:** Requires a valid API key and may have usage limits.
- **Security:** The backend only allows WebSocket connections from whitelisted origins.

---

## License

MIT

---

## Credits

- [Finnhub.io](https://finnhub.io/)
- [Google Gemini](https://ai.google.dev/gemini-api/docs/get-started)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)