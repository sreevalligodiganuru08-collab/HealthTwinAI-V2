def predict_health(data):
    heart_rate = data.get("heart_rate", 0)
    steps = data.get("steps", 0)
    sleep = data.get("sleep", 0)

    score = 0

    # simple correlation logic
    if heart_rate > 100 and sleep < 5:
        score += 2
    if steps < 3000:
        score += 1

    if score >= 2:
        return "High Risk"
    elif score == 1:
        return "Moderate Risk"
    else:
        return "Low Risk"