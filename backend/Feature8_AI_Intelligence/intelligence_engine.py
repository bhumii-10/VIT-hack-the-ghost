"""
AI Intelligence Engine - Core AI processing for disaster intelligence
"""

import numpy as np
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import random

class AIIntelligenceEngine:
    def __init__(self):
        self.models = {
            "flood_prediction": {"accuracy": 0.873, "last_trained": "2024-01-15"},
            "earthquake_prediction": {"accuracy": 0.821, "last_trained": "2024-01-10"},
            "cyclone_prediction": {"accuracy": 0.897, "last_trained": "2024-01-20"},
            "fire_prediction": {"accuracy": 0.912, "last_trained": "2024-01-18"},
            "landslide_prediction": {"accuracy": 0.856, "last_trained": "2024-01-12"}
        }
        
        self.feature_weights = {
            "weather_patterns": 0.25,
            "geographical_factors": 0.20,
            "historical_data": 0.20,
            "satellite_imagery": 0.15,
            "sensor_data": 0.10,
            "social_indicators": 0.10
        }
    
    def extract_features(self, latitude: float, longitude: float, disaster_type: str) -> Dict:
        """Extract features for AI analysis"""
        # Simulate feature extraction from various data sources
        features = {
            "location": {"lat": latitude, "lon": longitude},
            "weather_patterns": {
                "temperature": random.uniform(15, 45),
                "humidity": random.uniform(30, 90),
                "precipitation": random.uniform(0, 200),
                "wind_speed": random.uniform(0, 50),
                "pressure": random.uniform(980, 1020)
            },
            "geographical_factors": {
                "elevation": random.uniform(0, 3000),
                "slope": random.uniform(0, 45),
                "soil_type": random.choice(["clay", "sand", "loam", "rock"]),
                "vegetation_density": random.uniform(0, 1),
                "water_body_proximity": random.uniform(0, 100)
            },
            "historical_data": {
                "past_incidents": random.randint(0, 20),
                "frequency": random.uniform(0, 5),
                "severity_trend": random.choice(["increasing", "decreasing", "stable"]),
                "seasonal_pattern": random.uniform(0, 1)
            },
            "infrastructure": {
                "population_density": random.uniform(100, 10000),
                "building_vulnerability": random.uniform(0, 1),
                "road_network_density": random.uniform(0, 1),
                "emergency_services_proximity": random.uniform(1, 50)
            }
        }
        
        return features
    
    def predict_disaster_probability(self, features: Dict, disaster_type: str) -> Dict:
        """Predict disaster probability using AI models"""
        model_info = self.models.get(f"{disaster_type}_prediction", self.models["flood_prediction"])
        
        # Simulate AI model prediction
        base_probability = random.uniform(0.1, 0.9)
        
        # Adjust based on features
        weather_factor = self.calculate_weather_risk(features["weather_patterns"], disaster_type)
        geo_factor = self.calculate_geographical_risk(features["geographical_factors"], disaster_type)
        historical_factor = self.calculate_historical_risk(features["historical_data"], disaster_type)
        
        # Weighted combination
        probability = (
            base_probability * 0.4 +
            weather_factor * self.feature_weights["weather_patterns"] +
            geo_factor * self.feature_weights["geographical_factors"] +
            historical_factor * self.feature_weights["historical_data"]
        )
        
        probability = max(0.0, min(1.0, probability))
        confidence = model_info["accuracy"] * random.uniform(0.9, 1.1)
        confidence = max(0.0, min(1.0, confidence))
        
        return {
            "probability": round(probability, 4),
            "confidence": round(confidence, 4),
            "model_accuracy": model_info["accuracy"],
            "contributing_factors": {
                "weather_risk": round(weather_factor, 3),
                "geographical_risk": round(geo_factor, 3),
                "historical_risk": round(historical_factor, 3)
            }
        }
    
    def calculate_weather_risk(self, weather_data: Dict, disaster_type: str) -> float:
        """Calculate weather-based risk factor"""
        if disaster_type == "flood":
            # High precipitation and humidity increase flood risk
            precip_risk = min(weather_data["precipitation"] / 100, 1.0)
            humidity_risk = weather_data["humidity"] / 100
            return (precip_risk * 0.7 + humidity_risk * 0.3)
        
        elif disaster_type == "fire":
            # High temperature, low humidity, high wind increase fire risk
            temp_risk = max(0, (weather_data["temperature"] - 25) / 20)
            humidity_risk = 1 - (weather_data["humidity"] / 100)
            wind_risk = min(weather_data["wind_speed"] / 30, 1.0)
            return (temp_risk * 0.4 + humidity_risk * 0.4 + wind_risk * 0.2)
        
        elif disaster_type == "cyclone":
            # Low pressure, high wind, high humidity
            pressure_risk = max(0, (1013 - weather_data["pressure"]) / 30)
            wind_risk = min(weather_data["wind_speed"] / 50, 1.0)
            humidity_risk = weather_data["humidity"] / 100
            return (pressure_risk * 0.5 + wind_risk * 0.3 + humidity_risk * 0.2)
        
        else:
            return random.uniform(0.2, 0.8)
    
    def calculate_geographical_risk(self, geo_data: Dict, disaster_type: str) -> float:
        """Calculate geography-based risk factor"""
        if disaster_type == "flood":
            # Low elevation, high water body proximity increase risk
            elevation_risk = max(0, 1 - (geo_data["elevation"] / 1000))
            water_risk = max(0, 1 - (geo_data["water_body_proximity"] / 50))
            slope_risk = max(0, 1 - (geo_data["slope"] / 30))
            return (elevation_risk * 0.4 + water_risk * 0.4 + slope_risk * 0.2)
        
        elif disaster_type == "landslide":
            # High slope, certain soil types increase risk
            slope_risk = min(geo_data["slope"] / 45, 1.0)
            soil_risk = 0.8 if geo_data["soil_type"] in ["clay", "sand"] else 0.3
            vegetation_risk = 1 - geo_data["vegetation_density"]
            return (slope_risk * 0.5 + soil_risk * 0.3 + vegetation_risk * 0.2)
        
        elif disaster_type == "earthquake":
            # Geological factors (simplified)
            return random.uniform(0.3, 0.7)
        
        else:
            return random.uniform(0.2, 0.8)
    
    def calculate_historical_risk(self, historical_data: Dict, disaster_type: str) -> float:
        """Calculate history-based risk factor"""
        # More past incidents increase risk
        incident_risk = min(historical_data["past_incidents"] / 10, 1.0)
        
        # Higher frequency increases risk
        frequency_risk = min(historical_data["frequency"] / 3, 1.0)
        
        # Seasonal patterns
        seasonal_risk = historical_data["seasonal_pattern"]
        
        # Trend adjustment
        trend_multiplier = 1.2 if historical_data["severity_trend"] == "increasing" else 0.8
        
        base_risk = (incident_risk * 0.4 + frequency_risk * 0.4 + seasonal_risk * 0.2)
        return min(base_risk * trend_multiplier, 1.0)
    
    def generate_risk_explanation(self, prediction: Dict, features: Dict, disaster_type: str) -> List[str]:
        """Generate human-readable explanation of risk factors"""
        explanations = []
        factors = prediction["contributing_factors"]
        
        if factors["weather_risk"] > 0.7:
            explanations.append(f"Current weather conditions significantly increase {disaster_type} risk")
        elif factors["weather_risk"] > 0.4:
            explanations.append(f"Weather conditions moderately favor {disaster_type} occurrence")
        
        if factors["geographical_risk"] > 0.7:
            explanations.append(f"Geographical features create high vulnerability to {disaster_type}")
        elif factors["geographical_risk"] > 0.4:
            explanations.append(f"Location has moderate geographical risk factors for {disaster_type}")
        
        if factors["historical_risk"] > 0.7:
            explanations.append(f"Historical data shows frequent {disaster_type} events in this area")
        elif factors["historical_risk"] > 0.4:
            explanations.append(f"Area has experienced {disaster_type} events in the past")
        
        if prediction["probability"] > 0.8:
            explanations.append("Multiple risk factors align to create very high probability")
        elif prediction["probability"] > 0.6:
            explanations.append("Several risk factors contribute to elevated probability")
        
        return explanations
    
    def analyze_multi_disaster_scenario(self, latitude: float, longitude: float, 
                                      disaster_types: List[str]) -> Dict:
        """Analyze multiple disaster scenarios simultaneously"""
        results = {}
        
        for disaster_type in disaster_types:
            features = self.extract_features(latitude, longitude, disaster_type)
            prediction = self.predict_disaster_probability(features, disaster_type)
            explanation = self.generate_risk_explanation(prediction, features, disaster_type)
            
            results[disaster_type] = {
                "prediction": prediction,
                "features": features,
                "explanation": explanation
            }
        
        # Calculate compound risk
        probabilities = [results[dt]["prediction"]["probability"] for dt in disaster_types]
        compound_risk = 1 - np.prod([1 - p for p in probabilities])
        
        # Identify primary threats
        sorted_disasters = sorted(disaster_types, 
                                key=lambda x: results[x]["prediction"]["probability"], 
                                reverse=True)
        
        return {
            "individual_analyses": results,
            "compound_risk": round(compound_risk, 4),
            "primary_threats": sorted_disasters[:3],
            "analysis_timestamp": datetime.now().isoformat(),
            "model_versions": self.models
        }

# Global engine instance
ai_engine = AIIntelligenceEngine()