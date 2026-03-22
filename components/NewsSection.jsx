'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/utils';

export default function NewsSection({ news, ticker }) {
    const PAGE_SIZE = 9;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    if (!news || news.length === 0) {
        return (
            <div className="bg-[#10151aee] text-slate-400 p-6 rounded-2xl shadow-xl flex items-center justify-center h-64 border border-[#23272f]">
                <p>No recent news available for {ticker || 'the selected ticker'}.</p>
            </div>
        );
    }

    const visibleNews = news.slice(0, visibleCount);
    const hasMore = visibleCount < news.length;

    return (
        <div className="bg-[#10151aee] p-8 rounded-2xl shadow-2xl text-white border border-[#23272f]">
            <h2 className="text-2xl font-bold mb-3 text-center tracking-tight">
                Recent News for <span className="text-lime-200">{ticker}</span>
            </h2>
            <div className="w-20 h-1 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 via-blue-400 to-red-500 opacity-70" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleNews.map((item, index) => (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-[#181d23] hover:bg-[#23272f] rounded-xl p-5 transition-all duration-200 border border-[#23272f] shadow-lg h-full"
                    >
                        <h3 className="font-semibold text-lg text-white mb-1 line-clamp-2">{item.headline}</h3>
                        <p className="text-slate-400 text-sm mb-2 line-clamp-3">{item.summary}</p>
                        <p className="text-xs flex items-center gap-2 text-slate-500 mt-3">
                            <span>🌐</span>
                            <span className="-ml-1 font-semibold text-violet-300">{item.source}</span>
                            <span>•</span>
                            <span>{formatDate(new Date(item.datetime * 1000))}</span>
                        </p>
                    </a>
                ))}
            </div>
            {hasMore && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        Show More
                    </button>
                </div>
            )}
        </div>
    );
}