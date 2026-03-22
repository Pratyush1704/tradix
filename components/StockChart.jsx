'use client';

import React from 'react';
import { useState } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';

const RANGE_OPTIONS = [
    { label: '3D', value: '3d' },
    { label: '1W', value: '1w' },
    { label: '3W', value: '3w' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: '3Y', value: '3y' },
    { label: 'Max', value: 'max' }
];

function filterDataByRange(data, range) {
    if (range === 'all') return data;
    const now = new Date();
    let fromDate;
    switch (range) {
        case '3d':
            fromDate = new Date(now);
            fromDate.setDate(now.getDate() - 3);
            break;
        case '1w':
            fromDate = new Date(now);
            fromDate.setDate(now.getDate() - 7);
            break;
        case '3w':
            fromDate = new Date(now);
            fromDate.setDate(now.getDate() - 21);
            break;
        case '6m':
            fromDate = new Date(now);
            fromDate.setMonth(now.getMonth() - 6);
            break;
        case '1y':
            fromDate = new Date(now);
            fromDate.setFullYear(now.getFullYear() - 1);
            break;
        case '3y':
            fromDate = new Date(now);
            fromDate.setFullYear(now.getFullYear() - 3);
            break;
        default:
            return data;
    }
    return data.filter(item => new Date(item.date) >= fromDate);
}

export default function StockChart({ historicalData, ticker }) {
    const [range, setRange] = useState('max');

    if (!historicalData || historicalData.length === 0) {
        return (
            <div className="bg-[#181d23] text-slate-400 p-8 rounded-2xl shadow-2xl flex items-center justify-center h-96 border border-[#23272f]">
                <p>No historical data available for {ticker || 'the selected ticker'}.</p>
            </div>
        );
    }

    const filteredData = filterDataByRange(historicalData, range);

    const chartData = filteredData.map(item => ({
        ...item,
        date: new Date(item.date).getTime(),
        formattedDate: formatDate(item.date)
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-[#10151aee] text-white p-4 rounded-xl shadow-xl border border-[#23272f] text-sm">
                    <p className="font-bold text-green-400 mb-1">{dataPoint.formattedDate}</p>
                    <p>Open: <span className="text-white">{formatCurrency(dataPoint.open)}</span></p>
                    <p>High: <span className="text-green-400">{formatCurrency(dataPoint.high)}</span></p>
                    <p>Low: <span className="text-red-400">{formatCurrency(dataPoint.low)}</span></p>
                    <p>Close: <span className="text-blue-400">{formatCurrency(dataPoint.close)}</span></p>
                    <p>Volume: <span className="text-white">{dataPoint.volume.toLocaleString()}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#10151aee] p-8 rounded-2xl shadow-2xl w-full h-full md:h-[540px] border border-[#23272f]">
            <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
                Historical Performance of <span className="text-fuchsia-300">{ticker}</span>
            </h2>
            <div className="w-24 h-1 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 via-blue-400 to-red-500 opacity-70" />

            <div className="flex justify-center gap-2 mb-6">
                {RANGE_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            range === opt.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#23272f] text-slate-300 hover:bg-blue-400 hover:text-white'
                        }`}
                        onClick={() => setRange(opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <ResponsiveContainer width="100%" height="80%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#23272f" />
                    <XAxis
                        dataKey="date"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(unixTime) => formatDate(new Date(unixTime))}
                        minTickGap={60}
                        tick={{ fill: '#cbd5e1', fontWeight: 500 }}
                        stroke="#23272f"
                    />
                    <YAxis
                        dataKey="close"
                        orientation="right"
                        tickFormatter={(value) => formatCurrency(value, 'USD', 'en-US')}
                        tick={{ fill: '#cbd5e1', fontWeight: 500 }}
                        stroke="#23272f"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="close"
                        stroke="#22c55e"
                        fillOpacity={0.15}
                        fill="url(#colorUv)"
                        activeDot={{ r: 7, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                        isAnimationActive={true}
                    />
                    <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}