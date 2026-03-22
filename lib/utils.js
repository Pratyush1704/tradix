export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '';
    }
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatPercentage = (value, locale = 'en-US', minimumFractionDigits = 2, maximumFractionDigits = 2) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '';
    }
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: maximumFractionDigits,
    }).format(value);
};

export const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
        return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== 'string') {
        return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const safeJsonParse = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return null;
    }
};

export const convertToCsv = (data) => {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};
