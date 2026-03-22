export async function fetchQuote(ticker) {
    if (!ticker) {
        return null;
    }
    try {
        const response = await fetch(`/api/finnhub-proxy/quote?ticker=${ticker}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Finnhub API: Failed to fetch quote for ${ticker}: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

export async function fetchNews(ticker = '', fromDate = '', toDate = '') {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const defaultFromDate = fromDate || thirtyDaysAgo.toISOString().split('T')[0];
    const defaultToDate = toDate || today.toISOString().split('T')[0];

    try {
        const queryParams = new URLSearchParams({
            from: defaultFromDate,
            to: defaultToDate,
        });

        if (ticker) {
            queryParams.append('ticker', ticker);
        } else {
            queryParams.append('category', 'general');
        }

        const response = await fetch(`/api/finnhub-proxy/news?${queryParams.toString()}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Finnhub API: Failed to fetch news: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        return [];
    }
}
