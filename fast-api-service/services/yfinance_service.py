import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def get_historical_data_from_yfinance(ticker: str, period: str = "5y") -> list:
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)

        if df.empty:
            return []

        df = df.reset_index()
        df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')

        df.columns = [col.replace(' ', '_').replace('.', '_') for col in df.columns]

        required_columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        
        df_filtered = pd.DataFrame()
        for col in required_columns:
            if col in df.columns:
                df_filtered[col] = df[col]
            else:
                df_filtered[col] = None if col != 'Volume' else 0

        return df_filtered.to_dict(orient='records')

    except Exception as e:
        return []
