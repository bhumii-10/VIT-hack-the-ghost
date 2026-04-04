"""
AI explanation agent for resource recommendations
Provides human-readable reasoning using rule-based fallback system
"""

import os
import json
import logging
from typing import Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)

class ExplanationAgent:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        # Note: Removed deprecated google.generativeai package
        # Using rule-based explanations for reliability
        logger.info("Using rule-based explanation system (Gemini package deprecated)")
        self.model = None
    
    def generate_explanation(self, resource: Dict, incident: Dict, rank: int) -> tuple:
        """Generate human-readable explanation for resource recommendation"""
        try:
            # Always use fallback explanation for reliability
            return self._generate_fallback_explanation(resource, incident, rank)
        except Exception as e:
            logger.error(f"Explanation generation error: {e}")
            return f"Resource recommended based on compatibility with {incident.get('incident_type', 'incident')}.", 0.5
    
    def _generate_fallback_explanation(self, resource: Dict, incident: Dict, rank: int) -> tuple:
        """Generate rule-based explanation when AI is unavailable"""
        try:
            factors = []
            
            # Distance factor
            distance_score = resource.get('distance_score', 0.5)
            if distance_score < 0.3:
                factors.append("closest available unit")
            elif distance_score < 0.7:
                factors.append("reasonably close location")
            
            # Capacity factor
            capacity_score = resource.get('capacity_score', 0.5)
            if capacity_score > 0.7:
                factors.append("high capacity")
            elif capacity_score > 0.3:
                factors.append("adequate capacity")
            
            # Idle duration factor
            idle_score = resource.get('idle_duration_score', 0.5)
            if idle_score > 0.7:
                factors.append("well-rested unit")
            elif idle_score > 0.3:
                factors.append("available for deployment")
            
            # Response time factor
            response_score = resource.get('response_time_score', 0.5)
            if response_score < 0.3:
                factors.append("fastest response time")
            
            # Build explanation
            if factors:
                explanation = f"Recommended as rank {rank} because it offers {', '.join(factors[:3])} for this {incident.get('incident_type', 'incident').lower()}."
            else:
                explanation = f"Recommended as rank {rank} based on overall suitability analysis for this {incident.get('incident_type', 'incident').lower()}."
            
            # Calculate confidence based on suitability score
            suitability = resource.get('overall_suitability', 0.5)
            confidence = min(max(suitability * 0.8 + 0.2, 0.2), 0.95)  # Scale to 0.2-0.95
            
            return explanation, confidence
            
        except Exception as e:
            logger.error(f"Fallback explanation error: {e}")
            return f"Resource recommended based on compatibility with {incident.get('incident_type', 'incident')}.", 0.5
    
    def _extract_confidence(self, text: str) -> float:
        """Extract confidence value from AI response"""
        try:
            if 'Confidence:' in text:
                confidence_part = text.split('Confidence:')[1].strip()
                # Extract number from confidence part
                import re
                numbers = re.findall(r'0\.\d+|\d+\.\d+', confidence_part)
                if numbers:
                    confidence = float(numbers[0])
                    return min(max(confidence, 0.0), 1.0)
            
            # Default confidence based on text length and content
            if len(text) > 50 and any(word in text.lower() for word in ['because', 'due to', 'offers', 'provides']):
                return 0.75
            else:
                return 0.6
                
        except Exception:
            return 0.6
    
    def generate_chat_response(self, message: str, context: Dict = None) -> tuple:
        """Generate chatbot response for general emergency assistance"""
        try:
            # Always use fallback chat response for reliability
            return self._generate_fallback_chat_response(message, context)
        except Exception as e:
            logger.error(f"Chat response error: {e}")
            return "I'm here to help with emergency guidance. Please try rephrasing your question.", 0.5, ["Emergency help", "Disaster info", "Safety tips"]
    
    def _generate_fallback_chat_response(self, message: str, context: Dict = None) -> tuple:
        """Generate rule-based chat response"""
        message_lower = message.lower()
        
        # Emergency keywords
        if any(word in message_lower for word in ['emergency', 'help', 'urgent', 'crisis']):
            response = "For immediate emergencies, please call your local emergency services (911, 108, or 112). SankatSaathi provides crisis management support and resource coordination."
            suggestions = ["How to report an incident?", "Emergency contact numbers", "Disaster preparedness tips"]
        
        # Disaster types
        elif any(word in message_lower for word in ['flood', 'fire', 'earthquake', 'cyclone']):
            response = "SankatSaathi monitors various disaster types and provides real-time response coordination. Our system can help track incidents, allocate resources, and coordinate emergency response."
            suggestions = ["Disaster preparedness", "Resource allocation", "Emergency protocols"]
        
        # Resource related
        elif any(word in message_lower for word in ['resource', 'ambulance', 'rescue', 'shelter']):
            response = "Our resource management system tracks and allocates emergency resources including medical units, rescue teams, shelters, and supplies based on real-time needs and availability."
            suggestions = ["Available resources", "Resource request process", "Emergency services"]
        
        # General help
        else:
            response = "I'm SankatSaathi AI, your emergency response assistant. I can help with disaster preparedness, emergency protocols, and general crisis management guidance. How can I assist you today?"
            suggestions = ["Emergency preparedness", "Disaster types", "Resource information", "Safety guidelines"]
        
        return response, 0.7, suggestions
    
    def _generate_suggestions(self, message: str) -> List[str]:
        """Generate contextual suggestions based on user message"""
        message_lower = message.lower()
        
        if 'flood' in message_lower:
            return ["Flood safety measures", "Evacuation procedures", "Water purification"]
        elif 'fire' in message_lower:
            return ["Fire safety tips", "Evacuation routes", "Smoke inhalation prevention"]
        elif 'earthquake' in message_lower:
            return ["Earthquake preparedness", "Drop, Cover, Hold", "Building safety"]
        elif 'emergency' in message_lower:
            return ["Emergency contacts", "First aid basics", "Emergency kit checklist"]
        else:
            return ["Disaster preparedness", "Emergency protocols", "Safety guidelines", "Resource information"]