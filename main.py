from openai import OpenAI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from fuzzywuzzy import process
from sklearn.ensemble import RandomForestClassifier

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data = pd.read_csv("land_data.csv")
data = data.fillna(0)

# -----------------------------
# 🤖 AI MODEL TRAINING (EXISTING - NO CHANGE)
# -----------------------------
X = data[["Cases", "Ownership Changes"]]

y = []
for i in range(len(data)):
    c = int(float(data.iloc[i]["Cases"]))
    if c == 0:
        y.append(0)
    elif c <= 3:
        y.append(1)
    else:
        y.append(2)

model = RandomForestClassifier()
model.fit(X, y)


def calculate_risk(cases, ownership):
    pred = model.predict([[int(cases), int(ownership)]])[0]

    risk_level = ["Low", "Medium", "High"][pred]

    # ✅ ADD THIS (risk % calculation)
    risk_percent = min(100, int(cases)*15 + int(ownership)*10)

    return risk_level, risk_percent

# -----------------------------
# 🔥 NEW FEATURE 1: RISK SCORE (0–100)
# -----------------------------
def calculate_risk_score(row):
    score = 0

    if int(row["Cases"]) > 0:
        score += int(row["Cases"]) * 15

    if row["EC Status"].lower() == "dispute":
        score += 30

    if int(row["Ownership Changes"]) > 2:
        score += 20

    return min(score, 100)


# -----------------------------
# 🔥 NEW FEATURE 2: BUY DECISION
# -----------------------------
def get_decision(score):
    if score < 30:
        return "Safe to Buy"
    elif score < 70:
        return "Verify Before Buying"
    else:
        return "High Risk - Avoid"


# -----------------------------
# 🔥 NEW FEATURE 3: TRANSPARENCY SCORE
# -----------------------------
def calculate_transparency(row):
    score = 100

    if row["EC Status"].lower() == "dispute":
        score -= 30

    if int(row["Cases"]) > 0:
        score -= 20

    if row.get("Document Status", "").lower() == "invalid":
        score -= 30

    return max(score, 0)


# -----------------------------
# 🔥 NEW FEATURE 4: NEARBY ALERTS (DEMO)
# -----------------------------
def get_nearby_alerts():
    return [
        "Nearby land has dispute",
        "Road access issue nearby",
        "Water problem reported"
    ]


# -----------------------------
# 🔍 SEARCH API (UPDATED)
# -----------------------------
@app.get("/search")
def search_land(survey_no: str):

    survey_no = survey_no.strip().lower()

    # Clean dataset
    data["Survey No"] = data["Survey No"].astype(str).str.strip().str.lower()

    # Fuzzy matching
    match, score, _ = process.extractOne(survey_no, data["Survey No"])

    if score < 60:
        return []

    row = data[data["Survey No"] == match].iloc[0].to_dict()

    print(row)

    # -----------------------------
    # EXISTING FEATURE (NO CHANGE)
    # -----------------------------
    risk, percent = calculate_risk(row["Cases"], row["Ownership Changes"])

    row["Risk Level"] = risk
    row["Risk %"] = percent   # ✅ ADD THIS
    # -----------------------------
    # 🔥 NEW FEATURES ADDED
    # -----------------------------

    # 🤖 AI Risk Score
    row["Risk Score"] = calculate_risk_score(row)

    # 💡 Buy Decision
    row["Decision"] = get_decision(row["Risk Score"])

    # 🔍 Transparency Score
    row["Transparency Score"] = calculate_transparency(row)

    # 📍 Nearby Alerts
    row["Nearby Alerts"] = get_nearby_alerts()

    # 📄 Case Timeline (convert from case details)
    if "Case Details" in row:
        row["Case Timeline"] = row["Case Details"]

    return [row]
@app.get("/total_lands")
def total_lands():
    return {"total": len(data)}
@app.get("/filter")
def filter_by_village(village: str):
    village = village.strip().lower()

    filtered = data[data["Village"].str.lower() == village]

    return filtered.to_dict(orient="records")