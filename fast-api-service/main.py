from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services.api_schemas import HistoricalDataItem, PredictRequest, PredictResponse

import os

from services.yfinance_service import get_historical_data_from_yfinance
from services.ml_prediction_service import predict_next_day_close, MIN_REQUIRED_DAYS

app = FastAPI(
    title="TradiX.AI ML Service",
    description="FastAPI backend for stock data fetching and ML predictions.",
    version="0.1.0"
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://tradix-ai.vercel.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "TradiX.AI Fast-API-service is running!"}

@app.get("/historical-data/{ticker}")
async def get_stock_historical_data(ticker: str):
    data = get_historical_data_from_yfinance(ticker, period="5y")
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Historical data not found for {ticker} or ticker is invalid. Please check the ticker symbol."
        )
    return data

@app.post("/predict", response_model=PredictResponse)
async def predict_stock_price(request: PredictRequest):
    if len(request.historical_data) < MIN_REQUIRED_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient historical data provided. Requires at least {MIN_REQUIRED_DAYS} days for prediction, but received {len(request.historical_data)}."
        )
    
    try:
        historical_data_dicts = [item.model_dump() for item in request.historical_data]

        predicted_price = predict_next_day_close(
            ticker=request.ticker,
            original_sector=request.original_sector,
            historical_data=historical_data_dicts,
            prediction_date=request.prediction_date
        )
        
        return PredictResponse(predicted_price=predicted_price)

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML asset not found for prediction: {e}. Ensure models and scalers are correctly placed and committed to Git." # Added Git instruction
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data processing error during prediction: {e}. Check historical data format or sufficiency."
        )
    except Exception as e:
        print(f"main.py: An unexpected error occurred during prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during prediction: {e}"
        )
