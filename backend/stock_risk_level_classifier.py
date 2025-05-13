#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
import yfinance as yf
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    silhouette_score,
    calinski_harabasz_score,
    davies_bouldin_score
)

# ─── 1) Get S&P 500 tickers ────────────────────────────────────────────────────
wiki_url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
sp500    = pd.read_html(wiki_url, header=0)[0]
symbols  = (
    sp500["Symbol"]
    .str.replace(r"\.", "-", regex=True)
    .tolist()
)

# ─── 2) Pick top 100 by avg daily volume over last 60 days ───────────────────
vol_data = yf.download(
    symbols, period="60d", group_by="ticker", auto_adjust=True
)
avg_vol = {
    sym: vol_data[sym]["Volume"].mean()
    for sym in symbols
    if sym in vol_data.columns.get_level_values(0)
}
top100 = sorted(avg_vol, key=avg_vol.get, reverse=True)[:100]
print(f"Using top 100 by volume: {top100}\n")

# ─── 3) Download 1 year of daily price data for these 100 stocks ─────────────
prices = yf.download(
    tickers=top100,
    period="1y",
    auto_adjust=True,
    group_by="ticker",
    threads=True
)

# ─── 4) Fetch SPY for beta calculation ───────────────────────────────────────
df_spy = yf.download("SPY", period="1y", auto_adjust=True)
spy    = df_spy["Close"].pct_change().dropna()
spy.name = "SPY"

# ─── 5) Build price‐based features (ret, mom30, vol30, beta60) ──────────────
feat_list = []
for sym in top100:
    try:
        series = prices[sym]["Close"]
    except Exception:
        print(f"⚠️  Missing price series for {sym}, skipping.")
        continue

    df = pd.DataFrame({
        "ret":   series.pct_change(),
        "mom30": series.pct_change(30),
    })
    df["vol30"]     = df["ret"].rolling(30).std()
    df["vol30_log"] = np.log1p(df["vol30"])

    comb = pd.concat([df["ret"], spy], axis=1, join="inner").dropna()
    cov  = comb["ret"].rolling(60).cov(comb["SPY"])
    var  = comb["SPY"].rolling(60).var()
    df["beta60"] = cov.div(var).reindex(df.index)

    df_clean = df.dropna()
    if df_clean.empty:
        print(f"⚠️  {sym} has insufficient history, skipping.")
        continue

    last = df_clean.iloc[-1].to_dict()
    last["ticker"] = sym
    feat_list.append(last)

features_df = pd.DataFrame(feat_list).set_index("ticker")
print("Price-based features:\n", features_df.head(), "\n")

# ─── 6) Build fundamental features (PE, PB, dividend yield) ────────────────
funds = []
for sym in features_df.index:
    info = yf.Ticker(sym).info
    funds.append({
        "ticker":    sym,
        "pe":        info.get("trailingPE",    np.nan),
        "pb":        info.get("priceToBook",   np.nan),
        "div_yield": info.get("dividendYield", np.nan),
    })
fund_df = pd.DataFrame(funds).set_index("ticker")
print("Fundamentals:\n", fund_df.head(), "\n")

# ─── 7) Merge & impute missing data ──────────────────────────────────────────
data = features_df.join(fund_df)
print("Missing before imputation:\n", data.isna().sum(), "\n")

imp = SimpleImputer(strategy="median")
data_imputed = pd.DataFrame(
    imp.fit_transform(data),
    columns=data.columns,
    index=data.index
)
print("Missing after imputation:\n", data_imputed.isna().sum(), "\n")

# ─── 8) Scale & prepare for clustering ───────────────────────────────────────
data_imputed["vol30_log"] = np.log1p(data_imputed["vol30"])
feat_cols = ["vol30_log", "mom30", "beta60"]

rs   = RobustScaler().fit(data_imputed[feat_cols])
X_rs = rs.transform(data_imputed[feat_cols])

# Optional debug CSV
pd.DataFrame(X_rs, index=data_imputed.index, columns=feat_cols) \
  .to_csv("stock_level_data.csv")

# ─── 9) Evaluate cluster quality for k = 2…6 ─────────────────────────────────
print("Cluster evaluation metrics:")
for k in range(2, 7):
    km   = KMeans(n_clusters=k, random_state=42, n_init=10)
    labs = km.fit_predict(X_rs)
    print(
        f" k={k}: inertia={km.inertia_:.1f}, "
        f"sil={silhouette_score(X_rs, labs):.4f}, "
        f"CH={calinski_harabasz_score(X_rs, labs):.1f}, "
        f"DB={davies_bouldin_score(X_rs, labs):.4f}"
    )
print()

# ─── 10) Fit final KMeans (k=3) & map clusters → Low / Medium / High ───────
kmeans2      = KMeans(n_clusters=3, random_state=42, n_init=50).fit(X_rs)
labels_final = kmeans2.labels_

centroids = pd.DataFrame(
    rs.inverse_transform(kmeans2.cluster_centers_),
    columns=feat_cols
)
order    = centroids["vol30_log"].sort_values().index.tolist()
risk_map = {order[i]: lab for i, lab in enumerate(["Low","Medium","High"])}

data_imputed["cluster2"]    = labels_final
data_imputed["risk_label2"] = data_imputed["cluster2"].map(risk_map)
print("Final risk counts:\n", data_imputed["risk_label2"].value_counts(), "\n")

# ─── 11) Export artifacts ────────────────────────────────────────────────────

# Promote the index into a real column
data_imputed = data_imputed.reset_index()

# (a) Write lookup CSV for downstream use
data_imputed[
    ["ticker","vol30","mom30","beta60","risk_label2"]
].to_csv("stock_risk_kmeans_robust.csv", index=False)

# (b) Dump the pipeline (imputer → scaler → kmeans)
stock_clf_pipeline = Pipeline([
    ("imputer",       imp),
    ("robust_scaler", rs),
    ("kmeans",        kmeans2),
])
joblib.dump(stock_clf_pipeline, "stock_classifier.joblib")

print("✅ Artifacts saved: stock_classifier.joblib, stock_risk_kmeans_robust.csv")
