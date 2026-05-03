# backend/train_model.py

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

np.random.seed(42)
num_samples = 3000

# -----------------------------
# Generate Synthetic Realistic Data
# -----------------------------

heart_rate = np.random.randint(50, 140, num_samples)
spo2 = np.random.randint(85, 100, num_samples)
steps = np.random.randint(0, 15000, num_samples)
systolic_bp = np.random.randint(90, 180, num_samples)
diastolic_bp = np.random.randint(60, 110, num_samples)

# -----------------------------
# Clinical Risk Scoring Function
# -----------------------------

def clinical_risk_score(hr, sp, st, sys):

    score = 0

    # Heart Rate (30%)
    if hr < 60:
        score += 15
    elif hr <= 100:
        score += 5
    elif hr <= 120:
        score += 20
    else:
        score += 30

    # SpO2 (30%)
    if sp >= 95:
        score += 5
    elif sp >= 90:
        score += 20
    else:
        score += 30

    # Blood Pressure (25%)
    if sys < 120:
        score += 5
    elif sys < 140:
        score += 15
    else:
        score += 25

    # Steps (15%)
    if st > 8000:
        score += 5
    elif st >= 4000:
        score += 10
    else:
        score += 15

    return score


risk_scores = []
risk_labels = []

for hr, sp, st, sys in zip(heart_rate, spo2, steps, systolic_bp):
    score = clinical_risk_score(hr, sp, st, sys)
    risk_scores.append(score)

    if score <= 30:
        risk_labels.append(0)  # Low
    elif score <= 60:
        risk_labels.append(1)  # Moderate
    else:
        risk_labels.append(2)  # High


# -----------------------------
# Create Dataset
# -----------------------------

data = pd.DataFrame({
    "heart_rate": heart_rate,
    "spo2": spo2,
    "steps": steps,
    "systolic_bp": systolic_bp,
    "diastolic_bp": diastolic_bp,
    "risk_label": risk_labels
})

X = data.drop("risk_label", axis=1)
y = data["risk_label"]

# -----------------------------
# ML Pipeline
# -----------------------------

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        random_state=42
    ))
])

pipeline.fit(X, y)

# -----------------------------
# Save Model
# -----------------------------

model_path = os.path.join(os.path.dirname(__file__), "health_risk_model.pkl")
joblib.dump(pipeline, model_path)

print("✅ Clinical-rule-based AI model trained successfully.")