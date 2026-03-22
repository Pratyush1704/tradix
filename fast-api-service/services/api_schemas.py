from pydantic import BaseModel, Field
from typing import List

class HistoricalDataItem(BaseModel):
    Date: str = Field(..., example="2025-06-20")
    Open: float = Field(..., example=150.0)
    High: float = Field(..., example=152.5)
    Low: float = Field(..., example=149.0)
    Close: float = Field(..., example=151.0)
    Volume: float = Field(..., example=1000000.0)

class PredictRequest(BaseModel):
    ticker: str = Field(..., example="AAPL")
    original_sector: str = Field(..., example="Technology")
    historical_data: List[HistoricalDataItem] = Field(
        ...,
        description="List of historical OHLCV data points. Must contain sufficient data for feature engineering."
    )
    prediction_date: str = Field(
        ...,
        example="2025-06-25",
    )

class PredictResponse(BaseModel):
    predicted_price: float = Field(..., example=155.25)