from flask import Flask, request, jsonify, send_file
import pandas as pd
import joblib
from flask_cors import CORS
import io

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# 載入模型與資料
risk_pipe = joblib.load("risk_pipeline.joblib")
risk_le = joblib.load("risk_label_encoder.joblib")
picks_df = pd.read_csv("top_n_per_category.csv", index_col="ticker")

@app.route("/api/predict", methods=["POST"])
def predict():
    feature_cols = ["Age Group","Ethnicity","Education Level","Marital Status",
        "Financially dependent children","Annual Household Income",
        "Spending vs Income Past Year","Difficulty covering expenses",
        "Emergency fund to cover 3 Months expenses",
        "Current financial condition satisfaction",
        "Thinking about FC frequency","Account ownership check",
        "Savings/Money market/CD account ownership",
        "Employer-sponsored retirement plan ownership","Homeownership",
        "Regular contribution to a retirement account",
        "Non-retirement investments in stocks, bonds, mutual funds",
        "Self-efficacy","Self-rated overall financial knowledge"]  # 與你原本相同，略過細節
    data = {col: request.form.get(col) for col in feature_cols}
    X_user = pd.DataFrame([data])

    # 數值欄轉換
    numeric_feats = ["Age Group","Education Level",
        "Financially dependent children","Annual Household Income",
        "Spending vs Income Past Year","Difficulty covering expenses",
        "Emergency fund to cover 3 Months expenses",
        "Current financial condition satisfaction",
        "Thinking about FC frequency","Account ownership check",
        "Savings/Money market/CD account ownership",
        "Employer-sponsored retirement plan ownership",
        "Homeownership",
        "Regular contribution to a retirement account",
        "Non-retirement investments in stocks, bonds, mutual funds",
        "Self-efficacy","Self-rated overall financial knowledge"]  # 同上略
    for col in numeric_feats:
        X_user[col] = pd.to_numeric(X_user[col], errors="coerce")

    # 預測風險等級
    lbl_idx = risk_pipe.predict(X_user)[0]
    risk_bucket = risk_le.inverse_transform([lbl_idx])[0]

    return jsonify({"risk_bucket": risk_bucket})

@app.route("/api/simulate", methods=["POST"])
def simulate():
    risk = request.form["risk"]
    tickers = request.form.getlist("ticker")
    returns = [float(r) for r in request.form.getlist("pred_return")]
    amount = float(request.form["amount"])
    days = int(request.form["days"])

    per_stock = amount / len(tickers)
    results = []

    for sym, r in zip(tickers, returns):
        pct90 = r
        pct_d = pct90 * (days / 90.0)
        gain = per_stock * pct_d
        results.append({
            "ticker": sym,
            "invested": per_stock,
            "return_pct": pct_d * 100,
            "gain_usd": gain
        })

    return jsonify({
        "risk": risk,
        "amount": amount,
        "days": days,
        "results": results
    })

@app.route("/api/dashboard", methods=["POST"])
def dashboard():
    bucket_str = request.form["risk_bucket"]
    df = picks_df[picks_df["risk_label"] == bucket_str].nlargest(5, "pred_return").reset_index()
    recs = [{"ticker": r.ticker, "pred_return": r.pred_return}
            for r in df.itertuples(index=False)]

    return jsonify({
        "bucket": bucket_str,
        "picks": recs
    })

@app.route("/api/download/<bucket>")
def download_csv(bucket):
    
    # Filter the DataFrame
    df = picks_df[picks_df["risk_label"] == bucket]
    print(bucket)
    # Convert DataFrame to CSV in memory
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    # Convert to BytesIO for send_file
    return send_file(
        io.BytesIO(csv_buffer.read().encode('utf-8')),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"{bucket.lower()}_picks.csv"
    )

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5050)

