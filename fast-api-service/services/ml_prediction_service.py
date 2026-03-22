import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import json
import os
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MIN_REQUIRED_DAYS = 86
LSTM_SEQUENCE_LENGTH = 60
MAX_LOOKBACK_FEATURES = 26

BASE_DIR = os.getenv("APP_BASE_DIR", os.path.abspath(os.getcwd()))
logger.info(f"BASE_DIR resolved to: {BASE_DIR}")
CONFIG_DIR = os.path.join(BASE_DIR, 'config')
logger.info(f"CONFIG_DIR resolved to: {CONFIG_DIR}")
SCALERS_DIR = os.path.join(BASE_DIR, 'scalers')
logger.info(f"SCALERS_DIR resolved to: {SCALERS_DIR}")
MODELS_DIR = os.path.join(BASE_DIR, 'trained_models')
logger.info(f"MODELS_DIR resolved to: {MODELS_DIR}")

# Validate directories exist
if not os.path.exists(CONFIG_DIR):
    logger.error(f"Config directory not found: {CONFIG_DIR}")
    raise FileNotFoundError(f"Config directory not found: {CONFIG_DIR}")
if not os.path.exists(SCALERS_DIR):
    logger.error(f"Scalers directory not found: {SCALERS_DIR}")
    raise FileNotFoundError(f"Scalers directory not found: {SCALERS_DIR}")
if not os.path.exists(MODELS_DIR):
    logger.error(f"Models directory not found: {MODELS_DIR}")
    raise FileNotFoundError(f"Models directory not found: {MODELS_DIR}")

SECTOR_TO_CATEGORY = {}
try:
    config_path = os.path.join(CONFIG_DIR, 'sector_to_category.json')
    logger.info(f"Attempting to load config from: {config_path}")
    with open(config_path, 'r') as f:
        SECTOR_TO_CATEGORY = json.load(f)
    logger.info(f"Successfully loaded config from: {config_path}")
except FileNotFoundError:
    logger.error(f"Config file not found: {config_path}")
except json.JSONDecodeError:
    logger.error(f"Invalid JSON in {config_path}")
except Exception as e:
    logger.error(f"Unexpected error loading config: {e}")
if not SECTOR_TO_CATEGORY:
    logger.warning("SECTOR_TO_CATEGORY is empty. Using default group 'Cyclical_Growth' with placeholder data.")
    SECTOR_TO_CATEGORY = {"Cyclical_Growth": ["default"]}

LOADED_MODELS = {}
LOADED_FEATURE_SCALERS = {}
LOADED_TARGET_SCALERS = {}

def get_group_from_sector(original_sector: str) -> str:
    for group_name, sectors_list in SECTOR_TO_CATEGORY.items():
        if original_sector in sectors_list:
            return group_name
    return "Cyclical_Growth"

def _load_scaler_from_npy(group_name: str, scaler_type: str) -> MinMaxScaler:
    min_path = os.path.join(SCALERS_DIR, f"{scaler_type}_scaler_min_{group_name}.npy")
    scale_path = os.path.join(SCALERS_DIR, f"{scaler_type}_scaler_scale_{group_name}.npy")
    logger.info(f"Attempting to load scaler files for {group_name} ({scaler_type}): {min_path}, {scale_path}")

    if not os.path.exists(min_path):
        raise FileNotFoundError(f"Scaler 'min_' file not found for {group_name} ({scaler_type}): {min_path}")
    if not os.path.exists(scale_path):
        raise FileNotFoundError(f"Scaler 'scale_' file not found for {group_name} ({scaler_type}): {scale_path}")

    min_val = np.load(min_path)
    scale_val = np.load(scale_path)
    scaler = MinMaxScaler()
    scaler.min_ = min_val
    scaler.scale_ = scale_val
    scaler.n_features_in_ = len(scale_val)
    logger.info(f"Successfully loaded scaler for {group_name} ({scaler_type})")
    return scaler

def _load_model(group_name: str) -> tf.keras.Model:
    model_path = os.path.join(MODELS_DIR, f"lstm_gru_model_{group_name}.h5")
    logger.info(f"Attempting to load model from: {model_path}")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found for {group_name}: {model_path}")
    model = tf.keras.models.load_model(model_path, compile=False)
    logger.info(f"Successfully loaded model for {group_name}")
    return model

for group_name in SECTOR_TO_CATEGORY.keys():
    try:
        LOADED_MODELS[group_name] = _load_model(group_name)
        LOADED_FEATURE_SCALERS[group_name] = _load_scaler_from_npy(group_name, 'feature')
        LOADED_TARGET_SCALERS[group_name] = _load_scaler_from_npy(group_name, 'target')
        logger.info(f"Successfully loaded ML assets for {group_name}")
    except FileNotFoundError as e:
        logger.error(f"Failed to load ML assets for {group_name}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error loading ML assets for {group_name}: {e}")
if not LOADED_MODELS:
    logger.error("No models or scalers were loaded. Check config and asset directories.")
    raise RuntimeError("Failed to load ML assets during initialization.")

def calculate_single_stock_features(df_input: pd.DataFrame) -> pd.DataFrame:
    df = df_input.copy()
    df.columns = [col.lower() for col in df.columns]
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date').sort_index()
    elif not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index, errors='coerce')
        df.dropna(subset=[df.index.name], inplace=True)
    
    numeric_cols = ['open', 'high', 'low', 'close', 'volume']
    for col in numeric_cols:
        if col not in df.columns:
            raise ValueError(f"Missing expected column '{col}' in DataFrame for feature engineering. Check input data casing.")
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna(subset=numeric_cols).reset_index(drop=False)
    if df.empty:
        raise ValueError("Input DataFrame is empty after cleaning numeric columns.")

    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').set_index('date')

    df['day_of_week'] = df.index.dayofweek
    df['day_of_month'] = df.index.day
    df['month_of_year'] = df.index.month

    df['lag_return_1d'] = df['close'].pct_change(1)
    df['lag_return_2d'] = df['close'].pct_change(2)
    df['lag_return_5d'] = df['close'].pct_change(5)

    df['daily_range_norm'] = (df['high'] - df['low']) / df['open']
    df['open_close_gap_norm'] = (df['close'] - df['open']) / df['open']

    df['volume_change'] = df['volume'].pct_change()
    df['volume_ma_5'] = df['volume'].rolling(window=5).mean()

    df['sma_5'] = df['close'].rolling(window=5).mean()
    df['sma_10'] = df['close'].rolling(window=10).mean()
    df['sma_20'] = df['close'].rolling(window=20).mean()

    df['ema_5'] = df['close'].ewm(span=5, adjust=False).mean()
    df['ema_10'] = df['close'].ewm(span=10, adjust=False).mean()

    delta = df['close'].diff(1)
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = np.where(loss == 0, np.nan, gain / loss)
    df['rsi_14'] = 100 - (100 / (1 + rs))

    exp12 = df['close'].ewm(span=12, adjust=False).mean()
    exp26 = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = exp12 - exp26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    window_bb = 20
    num_std_dev = 2
    df['bb_sma_20'] = df['close'].rolling(window=window_bb).mean()
    df['bb_std_20'] = df['close'].rolling(window=window_bb).std()
    df['bb_upper'] = df['bb_sma_20'] + (df['bb_std_20'] * num_std_dev)
    df['bb_lower'] = df['bb_sma_20'] - (df['bb_std_20'] * num_std_dev)
    df['bb_bandwidth'] = np.where(df['bb_sma_20'] == 0, np.nan, ((df['bb_upper'] - df['bb_lower']) / df['bb_sma_20']))

    window_stoch = 14
    df['lowest_low'] = df['low'].rolling(window=window_stoch).min()
    df['highest_high'] = df['high'].rolling(window=window_stoch).max()
    stoch_k_denominator = (df['highest_high'] - df['lowest_low'])
    df['stoch_k'] = np.where(stoch_k_denominator == 0, np.nan, ((df['close'] - df['lowest_low']) / stoch_k_denominator) * 100)
    df['stoch_d'] = df['stoch_k'].rolling(window=3).mean()

    df = df.drop(columns=['lowest_low', 'highest_high'], errors='ignore')
    
    feature_cols_excluding_meta = [col for col in df.columns if col not in ['ticker', 'original_sector']]
    for col in feature_cols_excluding_meta:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].replace([np.inf, -np.inf], np.nan)
            if df[col].isna().any():
                median_value = df[col].median()
                df[col].fillna(median_value, inplace=True)
            df[col] = df[col].clip(lower=-1e6, upper=1e6)
    
    return df

def predict_next_day_close(
    ticker: str,
    original_sector: str,
    historical_data: list,
    prediction_date: str
) -> float:
    if not historical_data or not isinstance(historical_data, list):
        raise ValueError(f"Invalid historical_data for {ticker}. Expected a non-empty list.")
    group_name = get_group_from_sector(original_sector)

    model = LOADED_MODELS.get(group_name)
    feature_scaler = LOADED_FEATURE_SCALERS.get(group_name)
    target_scaler = LOADED_TARGET_SCALERS.get(group_name)

    if model is None or feature_scaler is None or target_scaler is None:
        raise FileNotFoundError(f"ML assets (model or scalers) for group '{group_name}' were not pre-loaded. Check server startup logs for errors during pre-loading.")

    df_raw = pd.DataFrame(historical_data)
    if df_raw.empty:
        raise ValueError(f"Empty historical data received for {ticker}.")
    
    df_raw['ticker'] = ticker
    df_raw['original_sector'] = original_sector
    
    df_features = calculate_single_stock_features(df_raw.copy())
    
    if len(df_features) < LSTM_SEQUENCE_LENGTH + 1:
        raise ValueError(f"Insufficient data after feature engineering for {ticker}. Required: {LSTM_SEQUENCE_LENGTH + 1}, Got: {len(df_features)}. Adjust historical data period.")

    features_for_scaling = [
        'open', 'high', 'low', 'close', 'volume',
        'day_of_week', 'day_of_month', 'month_of_year',
        'lag_return_1d', 'lag_return_2d', 'lag_return_5d',
        'daily_range_norm', 'open_close_gap_norm',
        'volume_change', 'volume_ma_5',
        'sma_5', 'sma_10', 'sma_20', 'ema_5', 'ema_10',
        'rsi_14', 'macd', 'macd_signal', 'macd_hist',
        'bb_sma_20', 'bb_std_20', 'bb_upper', 'bb_lower', 'bb_bandwidth',
        'stoch_k', 'stoch_d'
    ]
    
    missing_features = [f for f in features_for_scaling if f not in df_features.columns]
    if missing_features:
        raise ValueError(f"Missing required features for scaling: {', '.join(missing_features)}. "
                         f"Check 'calculate_single_stock_features' and 'features_for_scaling' list consistency.")

    X_input_df = df_features[features_for_scaling].tail(LSTM_SEQUENCE_LENGTH)
    
    if X_input_df.shape[0] != LSTM_SEQUENCE_LENGTH:
        raise ValueError(f"Extracted sequence has {X_input_df.shape[0]} rows, expected {LSTM_SEQUENCE_LENGTH}. "
                         f"Ensure enough historical data is provided for the sequence length and feature lookbacks.")

    X_input = X_input_df.values
    
    if X_input.shape[1] != feature_scaler.n_features_in_:
        raise ValueError(
            f"Mismatch in features for scaling. "
            f"Data has {X_input.shape[1]} features, but feature_scaler expects {feature_scaler.n_features_in_}. "
            f"Verify that the set of features and their order in 'features_for_scaling' list matches the data used for training the scaler."
        )

    input_data_scaled = feature_scaler.transform(X_input)
    input_data_scaled = input_data_scaled.reshape(1, LSTM_SEQUENCE_LENGTH, len(features_for_scaling))

    predicted_scaled_price = model.predict(input_data_scaled, verbose=0).flatten()[0]
    predicted_price = target_scaler.inverse_transform([[predicted_scaled_price]])[0][0]
    
    return float(predicted_price)
