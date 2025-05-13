#!/usr/bin/env python3
"""
full_pipeline.py
1) Load tickers & risk buckets CSV.

2) Retrieve End of Day(Stooq) price data for the listed tickers along with SPY.

3) Create sliding-window samples for volume 30, momentum, 30 day beta, and future return.

4) Median impute and scale to standard metrics.

5) Split in train/test + 5-fold CV and report MSE, then retrain on full data.

6) Export the imputer, scaler and Random Forest model as joblib.

7) Predict on each ticker’s most recent features ensuring TOP_N selections by bucket with ordinal rank (positives first).

8) Export the predictions as CSV with standardized column names.


"""
import time
import pandas as pd
import numpy as np
from pandas_datareader import data as pdr
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
import joblib

# PARAMETERS
INPUT_FILE     = "stock_risk_kmeans_robust.csv"   # columns: index=ticker, risk_label2
LOOKAHEAD_DAYS = 90
MIN_HIST_DAYS  = 60
TOP_N          = 5
SLEEP_SEC      = 1
OUTPUT_FILE    = "top_n_per_category.csv"
RANDOM_STATE   = 42


def fetch_close(symbol: str) -> pd.Series:
    """Fetch EOD Close prices via Stooq."""
    try:
        df = pdr.DataReader(symbol, "stooq")
        return df.sort_index()["Close"]
    except Exception as e:
        print(f"Fetch failed for {symbol}: {e}")
        return pd.Series(dtype=float)


def build_feature_df(df0: pd.DataFrame) -> pd.DataFrame:
    """Generate sliding-window features and target returns."""
    tickers = df0.index.tolist()
    spy = fetch_close("SPY").pct_change().dropna().rename("SPY")
    time.sleep(SLEEP_SEC)

    price_hist = {}
    for sym in tickers:
        series = fetch_close(sym).sort_index()
        if len(series) > MIN_HIST_DAYS + LOOKAHEAD_DAYS:
            price_hist[sym] = series
        else:
            print(f"{sym}: insufficient history, skipping")
        time.sleep(SLEEP_SEC)

    rows = []
    for sym, price in price_hist.items():
        ret = price.pct_change().dropna()
        n = len(price)
        start = max(30, MIN_HIST_DAYS)
        end = n - LOOKAHEAD_DAYS
        for i in range(start, end):
            vol30 = ret.iloc[i-29:i+1].std()
            mom30 = price.iloc[i] / price.iloc[i-30] - 1
            if i >= MIN_HIST_DAYS:
                spy_a = spy.reindex(ret.index)
                w_ret = ret.iloc[i-59:i+1].values
                w_spy = spy_a.iloc[i-59:i+1].values
                cov = np.cov(w_ret, w_spy, ddof=0)[0,1]
                var = np.var(w_spy, ddof=0)
                beta60 = cov/var if var > 0 else np.nan
            else:
                beta60 = np.nan
            future_price = price.iloc[i + LOOKAHEAD_DAYS]
            future_ret   = future_price / price.iloc[i] - 1
            rows.append({
                "ticker":        sym,
                "date":          price.index[i],
                "vol30":         vol30,
                "mom30":         mom30,
                "beta60":        beta60,
                "future_return": future_ret,
                "risk_label2":   df0.loc[sym, "risk_label2"]
            })
    feat_df = pd.DataFrame(rows).set_index(["ticker", "date"])
    if feat_df.empty:
        raise RuntimeError("No valid data to build features/targets!")
    return feat_df


def preprocess_features(X: pd.DataFrame):
    """Impute missing values and standard scale features."""
    imputer = SimpleImputer(strategy="median")
    X_imp   = imputer.fit_transform(X)
    scaler  = StandardScaler()
    X_scaled= scaler.fit_transform(X_imp)
    return X_scaled, imputer, scaler


def train_and_evaluate(X: np.ndarray, y: pd.Series) -> RandomForestRegressor:
    """Train/test split, CV MSE report, then retrain on full data."""
    X_tr, X_ts, y_tr, y_ts = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )
    model = RandomForestRegressor(n_estimators=100, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(
        model, X_tr, y_tr, cv=5, scoring="neg_mean_squared_error"
    )
    print(f"CV MSE: {-cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    model.fit(X_tr, y_tr)
    test_mse = np.mean((model.predict(X_ts) - y_ts)**2)
    print(f"Test MSE: {test_mse:.4f}")
    final_model = RandomForestRegressor(n_estimators=100, random_state=RANDOM_STATE)
    final_model.fit(X, y)
    return final_model


def save_artifacts(imputer, scaler, model):
    """Save preprocessing and model artifacts."""
    joblib.dump(imputer, "imputer.joblib")
    joblib.dump(scaler,  "scaler.joblib")
    joblib.dump(model,   "topreturn_model.joblib")
    print("Saved artifacts: imputer.joblib, scaler.joblib, topreturn_model.joblib")


def select_top_n(feat_df: pd.DataFrame, model, imputer, scaler, top_n: int = TOP_N) -> pd.DataFrame:
    """Predict returns, ensure TOP_N picks per bucket (positives first), and save."""
    latest = feat_df.groupby(level=0).tail(1).copy()
    X_raw = latest[["vol30","mom30","beta60"]]
    X_imp = imputer.transform(X_raw)
    X_scaled = scaler.transform(X_imp)
    latest["pred_return"] = model.predict(X_scaled)

    # Re-map risk_label2 to Low/Medium/High by vol30 median
    medians = latest.groupby("risk_label2")["vol30"].median().sort_values()
    mapping = {orig: new for orig, new in zip(medians.index, ["Low","Medium","High"]) }
    latest["risk_label"] = latest["risk_label2"].map(mapping)

    picks = []
    for label in ["Low","Medium","High"]:
        bucket = latest[latest["risk_label"] == label]
        positive = bucket[bucket["pred_return"] > 0]
        top_pos = positive.nlargest(top_n, "pred_return")
        if len(top_pos) < top_n:
            remainder = bucket.drop(top_pos.index)
            top_neg = remainder.nlargest(top_n - len(top_pos), "pred_return")
            picks.append(pd.concat([top_pos, top_neg]))
        else:
            picks.append(top_pos)

    final_df = pd.concat(picks)
    final_df.to_csv(
        OUTPUT_FILE,
        columns=["vol30","mom30","beta60","pred_return","risk_label"]
    )
    print(f"Top {top_n} picks per bucket → '{OUTPUT_FILE}'")
    return final_df


def main():
    df0     = pd.read_csv(INPUT_FILE, index_col="ticker")
    feat_df = build_feature_df(df0)
    X = feat_df[["vol30","mom30","beta60"]]
    y = feat_df["future_return"]
    X_scaled, imp, scaler = preprocess_features(X)
    model = train_and_evaluate(X_scaled, y)
    save_artifacts(imp, scaler, model)
    select_top_n(feat_df, model, imp, scaler)

if __name__ == "__main__":
    main()

