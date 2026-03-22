'use client';

import React from 'react';

export default function PredictButton({ onClick, loading, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`
                w-full py-3 px-6 rounded-lg text-lg font-bold transition-all duration-300 ease-in-out
                ${loading || disabled
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl cursor-pointer transition-colors'
                }
                focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50
                flex items-center justify-center space-x-2
                border border-[#23272f]
            `}
        >
            {loading ? (
                <>
                    <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Predicting...
                </>
            ) : (
                'Predict Future Price'
            )}
        </button>
    );
}