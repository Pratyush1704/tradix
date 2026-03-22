'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import Image from 'next/image';

function CompanyLogo({ ticker }) {
  const [currentSrc, setCurrentSrc] = useState(
    `https://eodhd.com/img/tlogos/US/${ticker}.png`
  );
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  const handleImageError = () => {
    if (!hasTriedFallback) {
      setCurrentSrc(`https://eodhd.com/img/tlogos/US/${ticker.toLowerCase()}.png`);
      setHasTriedFallback(true);
    } else {
      setCurrentSrc('https://em-content.zobj.net/source/apple/419/bar-chart_1f4ca.png');
    }
  };


  React.useEffect(() => {
    setCurrentSrc(`https://eodhd.com/img/tlogos/US/${ticker}.png`);
    setHasTriedFallback(false);
  }, [ticker]);


  return (
    <div className='bg-zinc-100 p-3 rounded-full'>
        <Image
          src={currentSrc}
          onError={handleImageError}
          alt={`${ticker} Logo`}
          width={30}
          height={30}
          unoptimized={true}
          className='object-contain'
        />
    </div>
  );
}

// Your existing RealtimeData component
export default function RealtimeData({ quote, ticker }) {
  if (!quote) {
    return (
      <motion.div
        className="bg-[#10151aee] text-slate-400 p-8 rounded-2xl shadow-2xl flex items-center justify-center h-48 border border-[#23272f]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p>No real-time data available for {ticker || 'the selected ticker'}.</p>
      </motion.div>
    );
  }

  const changeColorClass = quote.d >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <motion.div
      className="bg-[#10151aee] p-8 rounded-2xl shadow-2xl text-white border border-[#23272f]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className='flex justify-center mb-3'>
        <CompanyLogo ticker={ticker} />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-center tracking-tight">
        <span className="text-blue-300">{ticker}</span> Today's Quote
      </h2>
      <div className="w-20 h-1 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 via-blue-400 to-red-500 opacity-70" />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-between items-center py-2 border-b border-[#23272f] col-span-2">
          <span className="text-slate-300">Current Price:</span>
          <span className={`text-2xl font-extrabold ${changeColorClass}`}>
            {formatCurrency(quote.c)}{quote.d >= 0 ? '▲' : '▼'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#23272f]">
          <span className="text-slate-300">Change:</span>
          <span className={`text-xl font-semibold ${changeColorClass}`}>
            {quote.d >= 0 ? '+' : ''}{formatCurrency(quote.d)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#23272f]">
          <span className="text-slate-300">Change (%):</span>
          <span className={`text-xl font-semibold ${changeColorClass}`}>
            {quote.dp >= 0 ? '+' : ''}{formatPercentage(quote.dp / 100)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#23272f]">
          <span className="text-slate-300">Open:</span>
          <span className="font-medium">{formatCurrency(quote.o)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#23272f]">
          <span className="text-slate-300">Previous Close:</span>
          <span className="font-medium">{formatCurrency(quote.pc)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#23272f]">
          <span className="text-slate-300">High:</span>
          <span className="font-medium text-green-400">{formatCurrency(quote.h)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#23272f]">
          <span className="text-slate-300">Low:</span>
          <span className="font-medium text-red-400">{formatCurrency(quote.l)}</span>
        </div>
      </div>
      <p className="text-slate-500 text-xs mt-6 text-center">
        Prices may be delayed. Data provided by Finnhub.
      </p>
    </motion.div>
  );
}