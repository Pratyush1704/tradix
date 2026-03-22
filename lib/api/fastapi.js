import { MIN_REQUIRED_DAYS_FOR_PREDICTION } from '../constants';
import { formatDate } from '../utils';

export async function fetchHistoricalDataFromFastAPI(ticker, startDate, endDate) {
    if (!ticker || !startDate || !endDate) {
        return [];
    }

    try {
        // Call the Next.js API route instead of FastAPI directly
        const response = await fetch(`/api/historical-data/${ticker}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(`Failed to fetch historical data: ${errorData.detail || response.statusText}`);
        }

        const data = await response.json();
        if (data.length < MIN_REQUIRED_DAYS_FOR_PREDICTION) {
            console.warn(
                `Fetched only ${data.length} days of historical data for ${ticker}, ` +
                `but ${MIN_REQUIRED_DAYS_FOR_PREDICTION} are required for prediction.`
            );
        }
        return data;
    } catch (error) {
        return [];
    }
}

export async function requestPredictionFromFastAPI(ticker, originalSector, historicalData, predictionDate) {
    if (!ticker || !originalSector || !historicalData || historicalData.length === 0 || !predictionDate) {
        return null;
    }

    try {
        // Call the Next.js API route instead of FastAPI directly
        const response = await fetch(`/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticker: ticker,
                original_sector: originalSector,
                historical_data: historicalData,
                prediction_date: predictionDate,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(`Failed to get prediction: ${errorData.detail || response.statusText}`);
        }

        const data = await response.json();
        return data.predicted_price;
    } catch (error) {
        return null;
    }
}