# ==============================
# SEVERITY ENGINE (FINAL VERSION)
# ==============================
# Ported from HackVision_ML_Risk_Severity_Engine (1).py

# 1. LIFE-CRITICAL KEYWORDS
# If ANY of these appear, severity is FORCED to HIGH
LIFE_CRITICAL_KEYWORDS = [
    "trapped",
    "collapsed",
    "buried",
    "missing",
    "injured",
    "unconscious",
    "stuck",
    "rescue needed",
    "people trapped",
    "people injured"
]

# 2. BASE SEVERITY SCORES
# Ensures dangerous incident types never start low
BASE_SEVERITY_SCORE = {
    "earthquake": 50,
    "landslide": 45,
    "fire": 50,
    "flood": 40,
    "cyclone": 45,
    "building_collapse": 50,
    "other": 25
}

# 3. CONTEXT MODIFIERS (ONLY ADDITIVE)
ZONE_RISK_SCORE = {
    "urban": 5,
    "rural": 5,          # rural is NOT safe; resources are limited
    "industrial": 10
}

ZONE_HISTORY_SCORE = {
    "low_risk": 0,
    "medium_risk": 5,
    "high_risk": 10
}

TIME_OF_DAY_SCORE = {
    "night": 10,         # visibility low, people asleep
    "morning": 5,
    "afternoon": 0,
    "evening": 5
}

RAINFALL_SCORE = {
    "low": 0,
    "medium": 5,
    "high": 10
}

# 4. SEVERITY ENGINE FUNCTION
def analyze_severity(incident: dict) -> dict:
    """
    Final refined severity engine.
    Guarantees life-threatening situations are never downgraded.
    
    Expected input keys:
    - incident_type (str)
    - description (str)
    - location_zone (str)
    - zone_history (str)
    - time_of_day (str)
    - rainfall_level (str)
    """

    score = 0
    description = incident.get("description", "").lower()

    # ---- Base severity by incident type ----
    incident_type = incident.get("incident_type", "other").lower()
    score += BASE_SEVERITY_SCORE.get(incident_type, 25)

    # ---- Context-based additive scoring ----
    score += ZONE_RISK_SCORE.get(
        incident.get("location_zone", "").lower(), 0
    )

    score += ZONE_HISTORY_SCORE.get(
        incident.get("zone_history", "").lower(), 0
    )

    score += TIME_OF_DAY_SCORE.get(
        incident.get("time_of_day", "").lower(), 0
    )

    score += RAINFALL_SCORE.get(
        incident.get("rainfall_level", "").lower(), 0
    )

    # ---- LIFE-CRITICAL OVERRIDE (NON-NEGOTIABLE) ----
    for keyword in LIFE_CRITICAL_KEYWORDS:
        if keyword in description:
            return {
                "severity_level": "High",
                "priority_score": max(score, 80), # Ensure priority reflects the danger
                "reason": "Life-threatening condition detected"
            }

    # ---- Final severity mapping ----
    if score >= 70:
        severity = "High"
    elif score >= 40:
        severity = "Medium"
    else:
        severity = "Low"

    return {
        "severity_level": severity,
        "priority_score": score,
        "reason": "Context-based risk assessment"
    }
