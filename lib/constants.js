export const DEFAULT_TICKER = 'AAPL';
export const MIN_REQUIRED_DAYS_FOR_PREDICTION = 86;

export const ML_MODEL_GROUPS = [
    'Cyclical_Growth',
    'Defensive_Stable_Growth',
    'Financial_and_Real_Estate',
    'Commodity_Energy'
];

export const HISTORICAL_DATA_PERIODS = [
    { label: '1 Day', value: '1d' },
    { label: '5 Days', value: '5d' },
    { label: '1 Month', value: '1mo' },
    { label: '3 Months', 'value': '3mo' },
    { label: '6 Months', value: '6mo' },
    { label: '1 Year', value: '1y' },
    { label: '5 Years', value: '5y' },
    { label: 'Max', value: 'max' },
];

export const CHART_COLORS = {
    line: '#3B82F6',
    grid: '#E5E7EB',
    tooltipBg: '#1F2937',
    tooltipText: '#F9FAFB',
};
