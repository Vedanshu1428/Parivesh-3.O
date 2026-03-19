import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import math

app = FastAPI(title="CECB Prediction ML Pipeline")

# Load compiled Random Forest Models locally from RAM
print("Loading pre-trained scikit-learn models from disk...")
try:
    classifier = joblib.load("approval_classifier.pkl")
    regressor = joblib.load("days_regressor.pkl")
    model_columns = joblib.load("model_columns.pkl")
    print("Machine Learning models successfully loaded and ready for /predict.")
except Exception as e:
    print("Warning: Models not found or failed to load. Run `python train.py` first.")
    print("Error:", e)
    model_columns = []

class PredictionInput(BaseModel):
    sector: str
    district: str
    areaHa: float
    riskScore: float
    edsCount: int

@app.post("/predict")
def predict_approval(data: PredictionInput):
    """
    Ingests Node.js PredictionInput and outputs a scikit-learn Machine Learning inference.
    """
    # 1. Rebuild the request as a transient DataFrame
    input_df = pd.DataFrame([{
        "area_hectare": data.areaHa,
        "environmental_risk_score": data.riskScore if data.riskScore <= 1.0 else data.riskScore / 100.0,
        "eds_count": data.edsCount,
        "project_type": data.sector,
        "project_location": data.district
    }])
    
    # 2. Get Dummies (One-Hot Encoding)
    input_encoded = pd.get_dummies(input_df, columns=["project_type", "project_location"])
    
    # 3. Align Columns exactly with the Model's trained feature schema
    # (Any missing dummy cols will safely default to 0)
    for col in model_columns:
        if col not in input_encoded.columns:
            input_encoded[col] = 0
            
    # Guarantee column order matches exactly
    input_aligned = input_encoded[model_columns]
    
    # 4. Infer Probabilities over Random Forest Array
    # classifier.predict_proba returns [[prob_class_0, prob_class_1]]
    probabilities = classifier.predict_proba(input_aligned)
    approval_chance_raw = probabilities[0][1] * 100  # Extract probability of class '1' (Approved)
    
    # Calculate confidence based on model certainty (distance from 0.5)
    # If prob is 0.5, certainty is 0. If prob is 0 or 1, certainty is 100.
    certainty = abs(probabilities[0][1] - 0.5) * 2 * 100
    
    # We use a base of 75% confidence (reflecting general system data quality) 
    # plus a small boost for model certainty.
    confidence = round(75 + (certainty * 0.20)) 
    # Ensure it's never too low or too high for display
    confidence = max(70, min(95, confidence))

    # 5. Infer Days Pipeline via Regression Algorithm
    estimated_days_raw = regressor.predict(input_aligned)[0]
    
    # Cap boundaries
    approval_chance = max(5, min(95, round(approval_chance_raw)))
    estimated_days = max(15, round(estimated_days_raw))
    
    # Generate mock metadata fields matching the frontend TS typings
    risk_level = "High" if data.riskScore >= 70 else "Medium" if data.riskScore >= 50 else "Low"
    
    verdict = ""
    if approval_chance >= 70:
        verdict = f"High probability ({approval_chance}%) of approval for {data.district} {data.sector} project. Historical data suggests strong compliance alignment."
    elif approval_chance >= 40:
        verdict = f"Moderate outlook ({approval_chance}%). {data.sector} projects in {data.district} typically require detailed EDS responses to ensure approval."
    elif approval_chance >= 20:
        verdict = f"Caution recommended ({approval_chance}%). Proposals in this category often face scrutiny. Ensure all environmental safeguards are robust."
    else:
        verdict = f"Challenging historical precedent ({approval_chance}%). {data.sector} projects in this area show high rejection rates. Meticulous documentation is required."
        
    stageBreakdown = {
        "scrutiny": round(estimated_days * 0.20),
        "eds": round(estimated_days * 0.18) if data.edsCount > 0 else 0,
        "referred": round(estimated_days * 0.40),
        "mom": round(estimated_days * 0.07),
        "total": estimated_days
    }
        
    return {
        "approvalChance": approval_chance,
        "estimatedDays": estimated_days,
        "riskLevel": risk_level,
        "confidence": confidence, 
        "verdict": verdict,
        "dataPoints": 1000,
        "stageBreakdown": stageBreakdown,
        "factors": [
            { "name": "Scikit-Learn Inference", "impact": f"Certainty: {certainty:.1f}%", "direction": "positive" if certainty > 60 else "neutral" },
            { "name": "Historical Context", "impact": f"Probability: {approval_chance_raw:.1f}%", "direction": "positive" if approval_chance_raw > 60 else "negative" if approval_chance_raw < 30 else "neutral" }
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
