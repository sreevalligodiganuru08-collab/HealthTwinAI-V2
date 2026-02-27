# model.py


def calculate_risk_percentage(heart, spo2, steps):
    """
    Calculates health risk percentage (0–100).
    Higher = Better health.
    """

    score = 100

    # Heart Rate Impact
    if heart > 120:
        score -= 30
    elif heart > 100:
        score -= 15
    elif heart < 55:
        score -= 20

    # SpO2 Impact
    if spo2 < 90:
        score -= 35
    elif spo2 < 95:
        score -= 15

    # Activity Impact
    if steps < 1000:
        score -= 20
    elif steps < 4000:
        score -= 10

    # Clamp between 0–100
    return max(0, min(100, score))


def analyze_health(records):
    """
    Advanced analysis:
    - Risk percentage
    - Risk classification
    - Gantt-ready chart data (3 metrics in one)
    """

    if not records:
        return {
            "latest_record": {},
            "health_status": "No Data",
            "extra_insights": "No health records available"
        }

    latest = records[-1]

    # Safe extraction
    heart = int(latest.get("heart_rate", 0))
    spo2 = int(latest.get("spo2", 0))
    steps = int(latest.get("steps", 0))

    # -------------------------
    # Risk Percentage
    # -------------------------
    risk_percentage = calculate_risk_percentage(heart, spo2, steps)

    # -------------------------
    # Risk Classification
    # -------------------------
    if risk_percentage >= 75:
        health_status = "Normal"
    elif risk_percentage >= 50:
        health_status = "Moderate Risk"
    else:
        health_status = "High Risk"

    # -------------------------
    # GANTT CHART DATA (3-in-1)
    # -------------------------
    gantt_chart_data = []

    for index, record in enumerate(records):
        hr = int(record.get("heart_rate", 0))
        sp = int(record.get("spo2", 0))
        st = int(record.get("steps", 0))

        # Scale steps for visual balance
        scaled_steps = st / 100

        gantt_chart_data.append({
            "day": index + 1,
            "heart_rate": {
                "start": 0,
                "end": hr
            },
            "spo2": {
                "start": 0,
                "end": sp
            },
            "steps": {
                "start": 0,
                "end": scaled_steps
            }
        })

    # -------------------------
    # Insights Message
    # -------------------------
    extra_insights = (
        f"Risk Percentage: {risk_percentage}% | "
        f"Based on latest heart rate, SpO2 and activity levels"
    )

    # -------------------------
    # Final Response (STRICT FORMAT)
    # -------------------------
    return {
        "latest_record": latest,
        "health_status": health_status,
        "extra_insights": extra_insights,
        "gantt_chart_data": gantt_chart_data
    }