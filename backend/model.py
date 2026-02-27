def predict_risk(heart_rate, steps, sleep_hours):
    # Simple multi-signal logic

    if heart_rate > 100 and steps < 1000 and sleep_hours < 5:
        return "High Risk"

    elif heart_rate > 90 and sleep_hours < 6:
        return "Moderate Risk"

    else:
        return "Low Risk"