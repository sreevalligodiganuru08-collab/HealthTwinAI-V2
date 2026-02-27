def analyze_health(records):
    if not records:
        return {"status": "No Data"}

    latest = records[-1]

    heart = int(latest.get("heart_rate", 0))
    spo2 = int(latest.get("spo2", 0))
    steps = int(latest.get("steps", 0))

    status = "Healthy"

    if heart > 100:
        status = "High Heart Rate"
    elif spo2 < 95:
        status = "Low Oxygen Level"
    elif steps < 1000:
        status = "Inactive Lifestyle"

    return {
        "latest_record": latest,
        "health_status": status
    }