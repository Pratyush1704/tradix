'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import tickerToSector from '@/lib/ticker_to_sector.json';
import { motion } from 'framer-motion';

export default function Header({ onTickerChange, currentTicker }) {
    const [inputTicker, setInputTicker] = useState(currentTicker || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);

    // Build a list of {ticker, sector} from tickerToSector
    const tickerList = Object.entries(tickerToSector).map(([ticker, sector]) => ({
        ticker,
        sector: sector || '',
    }));

    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase();
        setInputTicker(value);

        if (value.length === 0) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const filtered = tickerList.filter(
            ({ ticker, sector }) =>
                ticker.startsWith(value) ||
                sector.toUpperCase().includes(value)
        );

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    };

    const handleSuggestionClick = (ticker) => {
        setInputTicker(ticker);
        setSuggestions([]);
        setShowSuggestions(false);
        onTickerChange(ticker);
        inputRef.current.blur();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputTicker.trim()) {
            onTickerChange(inputTicker.trim());
            setShowSuggestions(false);
        }
    };

    return (
        <motion.header
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="backdrop-blur bg-[#080606ee] text-white px-8 py-6 shadow-2xl sticky top-0 z-50 border-b border-[#23272f] drop-shadow-lg"
        >
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link href="/" className="flex flex-row items-center space-x-3 mb-4 sm:mb-0">
                    <div className='flex flex-row -space-x-2 text-3xl'>
                        <span className='text-emerald-400'>▲</span>
                        <span className='text-red-400'>▼</span>
                    </div>
                    <div className="flex flex-col font-extrabold tracking-tight">
                        <span className='text-3xl'>tradiX.AI</span>
                        <span className='text-gray-500'>Predictions for your ease!</span>
                    </div>
                </Link>

                <form onSubmit={handleSubmit} className="w-full sm:w-auto">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Enter Ticker or Sector (e.g., AAPL or Technology)"
                            value={inputTicker}
                            onChange={handleInputChange}
                            onFocus={() => setShowSuggestions(suggestions.length > 0)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                            className="w-full sm:w-80 p-3 pl-12 rounded-lg bg-[#181d23] border border-[#23272f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-inner"
                            autoComplete="off"
                        />
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                        </svg>
                        {showSuggestions && (
                            <ul className="absolute z-50 left-0 right-0 mt-2 bg-[#181d23] border border-[#23272f] rounded-lg max-h-60 overflow-y-auto shadow-xl">
                                {suggestions.map(({ ticker, sector }) => (
                                    <li
                                        key={ticker}
                                        className="px-4 py-2 cursor-pointer hover:bg-green-900/40 transition flex flex-row items-center justify-between"
                                        onMouseDown={() => handleSuggestionClick(ticker)}
                                    >
                                        <span className="font-semibold text-green-400">{ticker}</span>
                                        {sector && (
                                            <span className="text-xs text-gray-400 ml-2">{sector.replace(/_/g, ' ')}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </form>
            </div>
        </motion.header>
    );
}