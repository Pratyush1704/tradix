'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchQuote, fetchNews } from '@/lib/api/finnhub';
import { fetchHistoricalDataFromFastAPI, requestPredictionFromFastAPI } from '@/lib/api/fastapi';
import { DEFAULT_TICKER, MIN_REQUIRED_DAYS_FOR_PREDICTION } from '@/lib/constants';
import tickerToSector from '@/lib/ticker_to_sector.json';
import { formatDate } from '@/lib/utils';
import { useRealtimeQuote } from './useRealtimeQuote';

export const useStockData = () => {
    const [ticker, setTicker] = useState(DEFAULT_TICKER);
    const [quote, setQuote] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [news, setNews] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasRealtimeQuote, setHasRealtimeQuote] = useState(false);

    const setRealtimeQuote = useCallback((q) => {
        setHasRealtimeQuote(true);
        setQuote(prev => {
            if (!prev) return { ...q };
            const newPrice = q.c;
            const high = prev.h !== undefined ? Math.max(prev.h, newPrice) : newPrice;
            const low = prev.l !== undefined ? Math.min(prev.l, newPrice) : newPrice;
            const d = prev.pc !== undefined ? newPrice - prev.pc : undefined;
            const dp = prev.pc !== undefined ? (d / prev.pc) * 100 : undefined;
            return {
                ...prev,
                ...q,
                h: high,
                l: low,
                d,
                dp,
            };
        });
    }, []);

    useRealtimeQuote(ticker, setRealtimeQuote);

    useEffect(() => {
        setHasRealtimeQuote(false);
    }, [ticker]);

    const updateTicker = useCallback((newTicker) => {
        if (newTicker && newTicker.toUpperCase() !== ticker) {
            setTicker(newTicker.toUpperCase());
            setPrediction(null);
        }
    }, [ticker]);

    useEffect(() => {
        const fetchData = async () => {
            if (!ticker) {
                setQuote(null);
                setHistoricalData([]);
                setNews([]);
                setPrediction(null);
                setLoading(false);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const quoteData = await fetchQuote(ticker);
                if (quoteData && Object.keys(quoteData).length > 0) {
                    // Only set REST quote if no realtime quote yet
                    setQuote(q => hasRealtimeQuote ? q : quoteData);
                } else {
                    setQuote(null);
                }

                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                const formattedToday = formatDate(today);
                const formattedThirtyDaysAgo = formatDate(thirtyDaysAgo);

                // Always fetch news for the ticker, not general
                const newsData = await fetchNews(ticker, formattedThirtyDaysAgo, formattedToday);
                setNews(newsData);

                const oneYearAgo = new Date(today);
                oneYearAgo.setFullYear(today.getFullYear() - 1);
                const formattedOneYearAgo = formatDate(oneYearAgo);

                let historical = await fetchHistoricalDataFromFastAPI(
                    ticker,
                    formattedOneYearAgo,
                    formattedToday
                );

                if (historical && historical.length > 0) {
                    // Convert historical data keys to lowercase for internal use (e.g., chart display)
                    historical = historical.map(item => {
                        const newItem = {};
                        for (const key in item) {
                            newItem[key.toLowerCase()] = item[key];
                        }
                        return newItem;
                    });
                    setHistoricalData(historical);
                } else {
                    setHistoricalData([]);
                    if (quoteData && Object.keys(quoteData).length > 0) {
                        setError(currentErr => currentErr ? `${currentErr} No historical data found.` : `No historical data found for ${ticker}.`);
                    } else {
                        setError(`Could not retrieve data for ${ticker}. Please check the ticker symbol.`);
                    }
                }

            } catch (err) {
                setError(err.message || "Failed to fetch stock data.");
                setQuote(null);
                setHistoricalData([]);
                setNews([]);
                setPrediction(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [ticker, hasRealtimeQuote]);

    const triggerPrediction = useCallback(async () => {
        if (!historicalData || historicalData.length < MIN_REQUIRED_DAYS_FOR_PREDICTION) {
            setError(`Insufficient data: ${historicalData.length} days of historical data available. ` +
                     `At least ${MIN_REQUIRED_DAYS_FOR_PREDICTION} days are required for prediction.`);
            setPrediction(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const originalSector = tickerToSector[ticker];
            if (!originalSector) {
                setError(`Sector information not found for ${ticker}. Cannot perform prediction.`);
                setPrediction(null);
                setLoading(false);
                return;
            }

            const slicedHistoricalData = historicalData.slice(-MIN_REQUIRED_DAYS_FOR_PREDICTION);

            // Convert keys back to capitalized for FastAPI prediction endpoint
            const capitalizedHistoricalData = slicedHistoricalData.map(item => ({
                Date: item.date,
                Open: item.open,
                High: item.high,
                Low: item.low,
                Close: item.close,
                Volume: item.volume,
            }));

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const predictionDateFormatted = formatDate(tomorrow);

            const rawPredictedPrice = await requestPredictionFromFastAPI(
                ticker,
                originalSector,
                capitalizedHistoricalData,
                predictionDateFormatted
            );

            if (rawPredictedPrice === null || typeof rawPredictedPrice === 'undefined') {
                setPrediction(null);
                setError("Failed to get a raw price prediction from the ML backend. Please try again.");
                setLoading(false);
                return;
            }

            // Prepare detailed prompt for tradiX.AI
            const recentDataSummary = slicedHistoricalData
                .slice(-5)
                .map(d => `- ${d.date}: Open $${d.open.toFixed(2)}, High $${d.high.toFixed(2)}, Low $${d.low.toFixed(2)}, Close $${d.close.toFixed(2)}, Volume ${d.volume}`)
                .join('\n');

            const latestNewsSummary = news
                .slice(0, 15)
                .map(item => `- ${item.headline} (${item.source}): ${item.summary}`)
                .join('\n');

            const quoteSummary = quote
                ? `Current Quote:  
                Price: $${quote.c}  
                Open: $${quote.o}  
                High: $${quote.h}  
                Low: $${quote.l}  
                Previous Close: $${quote.pc}`
                : "No current quote data available.";

            const prompt = `
                You are tradiX.AI — a premier financial strategist and market tactician revered for precision, confidence, and tactical foresight. Think Harvey Specter armed with a Bloomberg terminal and zero patience for mediocrity. Your role is to deliver a powerful, forward-looking stock analysis for ${ticker}, crafted for elite investors and designed for immediate dashboard display. The tone must be decisive, intelligent, and entirely free of hedging. Every insight must be clear, sharp, and actionable — no symbols, no code, just high-grade market intelligence.

                Structure the report in six clean, paragraph-separated sections. Output must be plain text, ready for HTML display — no formatting syntax. Make sure it references every section is well detailed and long.

                1. Market Snapshot & Price Action  
                Set the tone with a crisp, confident breakdown of current price dynamics:  
                - Quote the current price, open, high, low, and previous close  
                - Note short-term price behavior: any directional shift, price dislocation, or volatility spike  
                - Mention deviations from recent intraday or multi-session ranges

                2. Micro-Trend & Pattern Recognition  
                Dissect short-term market structure using the last 5 trading sessions:  
                - Is the stock gaining momentum, consolidating, or fading?  
                - Identify actionable technical levels: support, resistance, breakout zones, or rejection points  
                - Discuss volume behavior — is it confirming price, or signaling caution?  
                - Include signs that may hint at a setup for the coming 1-2 weeks (e.g., compression zones, failed breakouts)

                3. News Drivers & Sentiment Context  
                Connect headline events to price movement and investor sentiment:  
                - Highlight only market-moving news — filter out irrelevant noise  
                - Explain how recent developments affect institutional positioning, retail sentiment, or fundamentals  
                - If there's no major news, reinforce conviction through technical strength, sector sympathy, or flow resilience  
                - Note any themes (earnings, regulation, guidance, macro events) with potential to extend into swing timeframe

                4. Sector Dynamics & Macro Alignment  
                Widen the lens and analyze the broader playing field:  
                - How is the sector behaving — showing strength, rotating, or under pressure?  
                - Is ${ticker} outperforming or tracking with sector peers?  
                - Connect to index behavior (S&P 500, Nasdaq) and macro overlays — interest rate shifts, CPI prints, earnings season tone  
                - Call out any macro or intermarket signals that could drive multi-day or multi-week moves

                5. tradiX.AI Estimated Close Price  
                Now give a bold, data-anchored price forecast — broken into two parts:  
                - Intraday Estimate: Based on current momentum, short-term structure, and recent trading behavior  
                - Swing/Long-Term (1-2 Weeks): Factor in technical setups, sentiment trends, sector rotation, macro alignment, and any catalysts that could influence swing positioning. Use volatility-adjusted logic — don't extrapolate blindly from short-term moves.

                Strictly use this exact output format:
                tradiX.AI Intraday Estimated Close Price: $X.XX  
                tradiX.AI Longterm Estimated Close Price: $Y.YY

                6. Final Takeaway for Investors  
                Close strong with a sharp insight or tactical guidance:  
                - Highlight what intelligent investors should monitor next  
                - Could be a level to watch, a sentiment shift, or a breakout setup  
                - Keep it crisp, actionable, and rooted in current behavior — no fluff, no forecasts without justification

                Execution Requirements:  
                - Speak with the tone of a market insider — confident, analytical, in control  
                - Your price targets are strategic calls, not model guesses — own them  
                - If the stock is in a defined range, don't break it without strong setup justification  
                - Reflect recent close behavior — if the stock is printing weak closes, don't ignore it  
                - Be swing-aware: think a few sessions ahead — recognize setups that may evolve over multiple days  
                - Be macro-aware: rate changes, CPI, earnings, or sector-specific catalysts should inform swing price logic

                Input Data for ${ticker}:  
                ${quoteSummary}

                Recent Historical Data (Last 5 Trading Days):  
                ${recentDataSummary}

                Latest News:  
                ${latestNewsSummary || "No recent news available."}

                Raw ML Model Predicted Close for ${predictionDateFormatted}: $${rawPredictedPrice.toFixed(2)}

                You are delivering a high-stakes, alpha-grade briefing for elite investors. Make it count.
                `;

            let llmAnalysis = "No analysis available.";
            let tradixPredictedPrice = rawPredictedPrice;
            let tradixSwingPredictedPrice = rawPredictedPrice;
            try {
                const response = await fetch('/api/gemini-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt }),
                });
                const result = await response.json();

                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    llmAnalysis = result.candidates[0].content.parts[0].text;
                } else if (result.error) {
                    llmAnalysis = `Analysis error: ${result.error}`;
                } else {
                    llmAnalysis = "Analysis could not be generated.";
                }

                const tradixPriceMatch = llmAnalysis.match(/tradiX\.AI Intraday Estimated Close Price:\s*\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
                if (tradixPriceMatch) {
                    tradixPredictedPrice = parseFloat(tradixPriceMatch[1]);
                }

                const tradixSwingPriceMatch = llmAnalysis.match(/tradiX\.AI Longterm Estimated Close Price:\s*\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
                if (tradixSwingPriceMatch) {
                    tradixSwingPredictedPrice = parseFloat(tradixSwingPriceMatch[1]);
                }

            } catch (llmError) {
                llmAnalysis = `Failed to generate analysis: ${llmError.message || 'Unknown error'}`;
            }

            setPrediction({
                predicted_price: tradixPredictedPrice,
                swing_price: tradixSwingPredictedPrice,
                raw_predict: rawPredictedPrice,
                llm_analysis: llmAnalysis
            });

        } catch (err) {
            setError(err.message || "Failed to get prediction.");
            setPrediction(null);
        } finally {
            setLoading(false);
        }
    }, [ticker, historicalData, news, quote]);

    return {
        ticker,
        quote,
        historicalData,
        news,
        prediction,
        loading,
        error,
        updateTicker,
        triggerPrediction,
    };
};