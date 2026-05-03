import os
import joblib
import numpy as np

# --------------------------------------------------
# LOAD AI MODEL
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
    print("AI model not found → Using rule-based system.")


# --------------------------------------------------
# RISK LEVEL + COLOR (🔥 IMPORTANT FIX)
# --------------------------------------------------
def get_health_status(score):
    if score >= 80:
        return "Low", "#28a745"     # green
    elif score >= 50:
        return "Moderate", "#ffc107"  # yellow
    else:
        return "High", "#dc3545"    # red


# --------------------------------------------------
# KEEPING YOUR MESSAGE FUNCTION (UNCHANGED ✅)
# --------------------------------------------------
def generate_health_message(avg, risk_level):
    heart = round(avg["heart_rate"])
    spo2 = round(avg["spo2"])
    steps = round(avg["steps"])
    sys = round(avg["systolic_bp"])
    dia = round(avg["diastolic_bp"])

    message = f"""

>>Based on your recent health records, here is a detailed overview of your current condition.

❤️ Heart Rate: Your average heart rate is {heart} bpm.A healthy resting heart rate typically ranges between 60–100 bpm.
"""
    if heart > 100:
        message += "Your heart rate is higher than normal, which may indicate stress, anxiety, or overexertion. Try relaxation techniques like deep breathing or meditation.\n"
    elif heart < 60:
        message += "Your heart rate is slightly low. This can be normal for athletes, but if you feel dizziness or fatigue, consider consulting a doctor.\n"
    else:
        message += "Your heart rate is within the normal range. Good job maintaining a stable condition.\n"

    message += f"""
🫁 Oxygen Level (SpO2): Your oxygen level is {spo2}%. A normal level should be above 95%.
"""
    if spo2 < 95:
        message += "This indicates slightly lower oxygen levels. Ensure proper ventilation, hydration, and consider breathing exercises.\n"
    else:
        message += "Your oxygen level is excellent, indicating efficient lung function.\n"

    message += f"""
🚶 Activity (Steps): You are averaging {steps} steps per day. Ideally, a healthy person should aim for at least 6,000–10,000 steps daily.
"""
    if steps < 4000:
        message += "Your activity level is low. Try incorporating walking, light exercise, or daily movement into your routine.\n"
    else:
        message += "Your activity level is good. Keep staying active!\n"

    message += f"""
💓 Blood Pressure: Your average BP is {sys}/{dia} mmHg. Normal BP is around 120/80 mmHg.
"""
    if sys > 140 or dia > 90:
        message += "Your blood pressure is higher than normal. Consider reducing salt intake, managing stress, and regular exercise.\n"
    elif sys < 90 or dia < 60:
        message += "Your blood pressure is slightly low. Stay hydrated and maintain a balanced diet.\n"
    else:
        message += "Your blood pressure is within a healthy range.\n"

    message += f"""
📊 Overall Health Status: {risk_level}

"""
    if risk_level == "High":
        message += "⚠️ Your overall health condition requires attention. It is strongly recommended to consult a healthcare professional and make immediate lifestyle improvements."
    elif risk_level == "Moderate":
        message += "⚡ Your health is moderately stable but needs improvement. Small lifestyle changes can significantly improve your condition."
    else:
        message += "✅ Your health condition is good. Maintain your current lifestyle and continue healthy habits."

    message += "\n\n💡 Tip: Consistency in healthy habits leads to long-term well-being. Stay active, eat balanced meals, and monitor your health regularly."

    return message.strip()


# --------------------------------------------------
# RULE BASED SCORE
# --------------------------------------------------
def calculate_score(avg):
    score = 100

    if avg["heart_rate"] > 100:
        score -= 15
    if avg["spo2"] < 95:
        score -= 20
    if avg["steps"] < 4000:
        score -= 15
    if avg["systolic_bp"] > 140 or avg["diastolic_bp"] > 90:
        score -= 20

    return max(0, score)


# --------------------------------------------------
# AI PREDICTION
# --------------------------------------------------
def ai_predict(avg):
    if ai_model is None:
        return None, None

    try:
        data = np.array([[ 
            avg["heart_rate"],
            avg["spo2"],
            avg["steps"],
            avg["systolic_bp"],
            avg["diastolic_bp"]
        ]])

        pred = ai_model.predict(data)[0]
        prob = ai_model.predict_proba(data)[0]
        confidence = round(float(max(prob)) * 100, 2)

        return int(pred), confidence

    except Exception as e:
        print("AI error:", e)
        return None, None


# --------------------------------------------------
# CHART SCORES (🔥 FIXED SCALING)
# --------------------------------------------------
def calculate_chart_scores(avg):
    heart = min(avg["heart_rate"] / 4, 25)
    spo2 = min(avg["spo2"] / 4, 25)
    steps = min(avg["steps"] / 400, 25)
    bp = min((avg["systolic_bp"] + avg["diastolic_bp"]) / 20, 25)

    return {
        "heart": round(heart),
        "spo2": round(spo2),
        "steps": round(steps),
        "bp": round(bp),
        "overall": round(heart + spo2 + steps + bp)
    }


# --------------------------------------------------
# MAIN FUNCTION
# --------------------------------------------------
def analyze_health(records):

    if not records:
        return {
            "health_status": "No Data",
            "risk_percentage": 0,
            "confidence": 0,
            "color": "gray",
            "extra_insights": "No records available",
            "avg": {},
            "chart_scores": {}
        }

    # ---- AVERAGES ----
    def avg_val(key):
        vals = [r.get(key, 0) for r in records]
        return sum(vals) / len(vals)

    avg = {
        "heart_rate": avg_val("heart_rate"),
        "spo2": avg_val("spo2"),
        "steps": avg_val("steps"),
        "systolic_bp": avg_val("systolic_bp"),
        "diastolic_bp": avg_val("diastolic_bp")
    }

    # ---- AI OR RULE ----
    ai_pred, confidence = ai_predict(avg)

    if ai_pred is not None:
        risk_percentage = confidence
    else:
        risk_percentage = calculate_score(avg)
        confidence = 0

    # ---- STATUS + COLOR (🔥 IMPORTANT)
    health_status, color = get_health_status(risk_percentage)

    # ---- MESSAGE
    message = generate_health_message(avg, health_status)

    # ---- CHART
    chart_scores = calculate_chart_scores(avg)

    return {
        "health_status": health_status,
        "risk_percentage": round(risk_percentage, 2),
        "confidence": confidence,
        "color": color,   # ✅ frontend color support
        "extra_insights": message,
        "avg": avg,
        "chart_scores": chart_scores
    }