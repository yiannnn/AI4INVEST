from flask import Flask, request, jsonify, send_file
import pandas as pd
import joblib
from flask_cors import CORS

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

@app.route("/api/dashboard", methods=["POST"])
def dashboard():
    bucket_str = request.form["risk_bucket"]
    bucket_code = risk_le.transform([bucket_str])[0]
    user_picks = picks_df[picks_df["bucket"] == bucket_code]

    return jsonify({
        "bucket": bucket_str,
        "picks": user_picks.reset_index().to_dict(orient="records")
    })

@app.route("/api/download/<bucket>")
def download_csv(bucket):
    bucket_code = risk_le.transform([bucket])[0]
    df = picks_df[picks_df["bucket"] == bucket_code]
    fname = f"{bucket.lower()}_picks.csv"
    df.to_csv(fname)
    return send_file(fname, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5050)

