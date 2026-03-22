'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

export default function PredictionDisplay({ prediction, ticker }) {
    if (!prediction) {
        return (
            <motion.div
                className="bg-[#10151aee] text-slate-400 p-8 rounded-2xl shadow-2xl flex items-center justify-center h-64 border border-[#23272f]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p>No prediction data available for {ticker}. Click "Predict Future Price" to generate one.</p>
            </motion.div>
        );
    }

    const { predicted_price, swing_price, raw_predict, llm_analysis } = prediction;

    return (
        <motion.div
            className="bg-[#10151aee] p-8 rounded-2xl shadow-2xl text-white border border-[#23272f]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <h2 className="text-2xl font-bold mb-2 text-center tracking-tight text-zinc-100">
                Prediction for {ticker}
            </h2>
            <div className="w-20 h-1 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 via-blue-400 to-red-500 opacity-70" />
            <div className="mb-8 pb-4 border-b border-[#23272f] text-center">
                <div className='flex flex-col md:flex-row justify-around mb-4'>
                    <div>
                        <p className="text-slate-300 text-lg mb-1">Predicted Intraday Future Price:</p>
                        <p className="text-5xl font-extrabold text-yellow-400 drop-shadow-lg">{formatCurrency(predicted_price)}</p>
                        <h6 className='mt-2 text-[11px] text-slate-400'>💵: Based on quantitative & qualitative factors.</h6>
                    </div>
                    <div className='mt-4 md:mt-0'>
                        <p className="text-slate-300 text-lg mb-1">Predicted Swing/Longterm Future Price:</p>
                        <p className="text-5xl font-extrabold text-green-400 drop-shadow-lg">{formatCurrency(swing_price)}</p>
                        <h6 className='mt-2 text-[11px] text-slate-400'>🧪: Experimental feature for testing & feedback!</h6>
                    </div>
                    <div className='mt-4 md:mt-0'>
                        <p className="text-slate-300 text-lg mb-1">Raw Model Longterm Future Price:</p>
                        <p className="text-5xl font-extrabold text-blue-400 drop-shadow-lg">{formatCurrency(raw_predict)}</p>
                        <h6 className='mt-2 text-[11px] text-slate-400'>🔬: Experimental feature entirely based on raw factors.</h6>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-white mb-4">Prediction Analysis:</h3>
                <div className="bg-[#181d23] p-4 rounded-md border border-[#23272f] max-h-60 overflow-y-auto">
                    <p className="text-slate-300 whitespace-pre-wrap">{llm_analysis}</p>
                </div>
            </div>
        </motion.div>
    );
}