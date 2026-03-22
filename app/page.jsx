'use client';

import React, { useEffect, useState } from 'react';
import { useStockData } from '@/hooks/useStockData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RealtimeData from '@/components/RealtimeData';
import StockChart from '@/components/StockChart';
import NewsSection from '@/components/NewsSection';
import PredictButton from '@/components/PredictButton';
import PredictionDisplay from '@/components/PredictionDisplay';
import { MIN_REQUIRED_DAYS_FOR_PREDICTION } from '@/lib/constants'

export default function Home() {
    const {
        ticker,
        quote,
        historicalData,
        news,
        prediction,
        loading,
        error,
        updateTicker,
        triggerPrediction,
    } = useStockData();

    // Show splash for a brief moment on initial load
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 1200); // 1.2s splash
        return () => clearTimeout(timer);
    }, []);

    const showMagic = loading || showSplash;

    return (
        <div className="min-h-screen bg-[#010101] text-white flex flex-col">
            {showMagic && (
                <div className="fixed inset-0 bg-slate-950 bg-opacity-90 flex flex-col items-center justify-center z-[200] transition-all">
                    <div className="flex flex-col items-center">
                        <div className="flex flex-row items-center mb-2 text-4xl font-extrabold tracking-tight">
                            <div className='flex flex-row -space-x-2'>
                                <span className='text-emerald-400 animate-bounce'>▲</span>
                                <span className='text-red-400 animate-bounce'>▼</span>
                            </div>
                            <span className='text-white'>tradiX.AI</span>
                        </div>
                        <div className="text-lg text-slate-200 font-semibold flex items-center gap-2">
                            <svg className="animate-spin h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            tradiX.AI is doing its magic...
                        </div>
                    </div>
                </div>
            )}

            <Header onTickerChange={updateTicker} currentTicker={ticker} />

            <main className="container mx-auto p-4 flex-grow">
                {error && (
                    <div className="bg-red-800 text-white p-4 rounded-md mb-6 shadow-md border border-red-700">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Responsive Bento-style grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: Real-time data & Predict button */}
                    <div className="lg:col-span-1 flex flex-col space-y-6">
                        <RealtimeData quote={quote} ticker={ticker} />
                        <PredictButton
                            onClick={triggerPrediction}
                            loading={loading}
                            disabled={!historicalData || historicalData.length < MIN_REQUIRED_DAYS_FOR_PREDICTION}
                        />
                    </div>

                    {/* Center/right: Stock chart */}
                    <div className="lg:col-span-2">
                        <StockChart historicalData={historicalData} ticker={ticker} />
                    </div>

                    {/* Full width: Prediction display */}
                    <div className="lg:col-span-3">
                        <PredictionDisplay prediction={prediction} ticker={ticker} />
                    </div>

                    {/* Full width: News section */}
                    <div className="lg:col-span-3">
                        <NewsSection news={news} ticker={ticker} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}