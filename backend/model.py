import os
import joblib
import numpy as np

# --------------------------------------------------
# Load AI Model Safely
# --------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "health_risk_model.pkl")

ai_model = None
if os.path.exists(MODEL_PATH):
    try:
        ai_model = joblib.load(MODEL_PATH)
        print("HealthTwin AI model loaded successfully.")
    except Exception as e:
        print("Error loading AI model:", e)
        ai_model = None
else:
    print("AI model file not found. Using rule-based fallback.")

# --------------------------------------------------
# RULE-BASED PARAMETER ANALYSIS
# --------------------------------------------------
def analyze_parameter_rules(heart, spo2, steps, systolic_bp, diastolic_bp):
    analysis = {}
    analysis["heart_rate"] = (
        "Critical" if heart > 120 or heart < 50 else "High" if heart > 100 else "Normal"
    )
    analysis["spo2"] = (
        "Critical" if spo2 < 90 else "Low" if spo2 < 95 else "Normal"
    )
    analysis["blood_pressure"] = (
        "Critical" if systolic_bp > 160 or diastolic_bp > 100
        else "High" if systolic_bp > 140 or diastolic_bp > 90
        else "Low" if systolic_bp < 90 or diastolic_bp < 60
        else "Normal"
    )
    analysis["activity"] = (
        "Very Low" if steps < 1000 else "Low" if steps < 4000 else "Active"
    )
    return analysis

# --------------------------------------------------
# RULE-BASED RISK SCORE (Fallback)
# --------------------------------------------------
def calculate_risk_percentage(heart, spo2, steps, systolic_bp, diastolic_bp):
    score = 100
    # Heart
    if heart > 120:
        score -= 30
    elif heart > 100:
        score -= 15
    elif heart < 55:
        score -= 20
    # SpO2
    if spo2 < 90:
        score -= 35
    elif spo2 < 95:
        score -= 15
    # Steps
    if steps < 1000:
        score -= 20
    elif steps < 4000:
        score -= 10
    # Blood Pressure
    if systolic_bp > 160 or diastolic_bp > 100:
        score -= 30
    elif systolic_bp > 140 or diastolic_bp > 90:
        score -= 15
    elif systolic_bp < 90 or diastolic_bp < 60:
        score -= 10
    return max(0, min(100, score))

# --------------------------------------------------
# AI PREDICTION
# --------------------------------------------------
def ai_predict_risk(heart, spo2, steps, systolic_bp, diastolic_bp):
    if ai_model is None:
        return None, None
    try:
        input_data = np.array([[heart, spo2, steps, systolic_bp, diastolic_bp]])
        prediction = ai_model.predict(input_data)[0]
        probabilities = ai_model.predict_proba(input_data)[0]
        confidence = round(float(max(probabilities)) * 100, 2)
        return int(prediction), confidence
    except Exception as e:
        print("AI prediction error:", e)
        return None, None

# --------------------------------------------------
# CHART SCORES FOR FRONTEND
# --------------------------------------------------
def calculate_chart_scores(latest):
    if not latest:
        return {"heart":0, "spo2":0, "steps":0, "bp":0, "overall":0}

    heart = min(latest.get("heart_rate",0)/4, 25)
    spo2 = min(latest.get("spo2",0)/4, 25)
    steps = min(latest.get("steps",0)/400, 25)
    bp = min((latest.get("systolic_bp",0) + latest.get("diastolic_bp",0))/20, 25)
    overall = round(heart + spo2 + steps + bp)
    return {"heart": round(heart), "spo2": round(spo2), "steps": round(steps), "bp": round(bp), "overall": overall}

# --------------------------------------------------
# MAIN ANALYSIS FUNCTION (All Records)
# --------------------------------------------------
def analyze_health(records):
    if not records:
        return {
            "latest_record": {},
            "health_status": "No Data",
            "risk_percentage": 0,
            "confidence": 0,
            "extra_insights": "No health records available",
            "gantt_chart_data": [],
            "avg": {},
            "chart_scores": {"heart":0, "spo2":0, "steps":0, "bp":0, "overall":0},
            "parameter_analysis": {}
        }

    # Calculate averages across all records
    def avg_key(key):
        values = [int(r.get(key, 0)) for r in records if r.get(key) is not None]
        return sum(values) / len(values) if values else 0

    avg_heart = avg_key("heart_rate")
    avg_spo2 = avg_key("spo2")
    avg_steps = avg_key("steps")
    avg_systolic = avg_key("systolic_bp")
    avg_diastolic = avg_key("diastolic_bp")

    # Use averages for analysis & charts
    parameter_analysis = analyze_parameter_rules(
        avg_heart, avg_spo2, avg_steps, avg_systolic, avg_diastolic
    )

    ai_prediction, confidence = ai_predict_risk(
        avg_heart, avg_spo2, avg_steps, avg_systolic, avg_diastolic
    )

    if ai_prediction is not None:
        health_status = (
            "Normal" if ai_prediction == 0
            else "Moderate Risk" if ai_prediction == 1
            else "High Risk"
        )
        risk_percentage = round(confidence)
        extra_insights = f"HealthTwin AI Prediction: {health_status} | Model Confidence: {confidence}%"
    else:
        risk_percentage = calculate_risk_percentage(avg_heart, avg_spo2, avg_steps, avg_systolic, avg_diastolic)
        health_status = (
            "Normal" if risk_percentage >= 80
            else "Moderate Risk" if risk_percentage >= 50
            else "High Risk"
        )
        confidence = 0
        extra_insights = f"Rule-based Risk Calculation Used | Risk Score: {risk_percentage}%"

    # Gantt chart data (trend visualization)
    gantt_chart_data = []
    for idx, r in enumerate(records):
        gantt_chart_data.append({
            "day": idx + 1,
            "heart_rate": {"start": 0, "end": r.get("heart_rate", 0)},
            "spo2": {"start": 0, "end": r.get("spo2", 0)},
            "steps": {"start": 0, "end": r.get("steps", 0)/100}
        })

    return {
        "latest_record": records[-1],
        "health_status": health_status,
        "risk_percentage": risk_percentage,
        "confidence": confidence,
        "parameter_analysis": parameter_analysis,
        "extra_insights": extra_insights,
        "gantt_chart_data": gantt_chart_data,
        "avg": {
            "heart_rate": round(avg_heart, 1),
            "spo2": round(avg_spo2, 1),
            "steps": round(avg_steps, 1),
            "systolic_bp": round(avg_systolic, 1),
            "diastolic_bp": round(avg_diastolic, 1)
        },
        "chart_scores": calculate_chart_scores(records[-1])
    }