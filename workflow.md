# 🚨 SankatSaathi - Workflows & Processes

This document provides a detailed breakdown of the end-to-end work processes and individual feature workflows within the SankatSaathi platform. 

---

## 🌟 1. End-To-End Operational Workflow (High-Level)

The entire system operates as a unified entity handling a crisis from the moment it is reported until it is resolved.

1. **Detection & Reporting**: An incident is reported by a user (via form or voice command), or automatically detected (via seismic monitoring or aggregated news).
2. **Analysis & Assessment**: The incident is instantly processed by the AI Severity Engine to assess the risk, context, and immediate needs.
3. **Emergency Routing**: If the situation is critical, auto-escalation triggers Twilio APIs to alert local authorities (Ambulance, Fire, Police).
4. **Intelligence & Prediction**: ML Hotspot detection evaluates if the incident might spread or affect surrounding areas.
5. **Resource Dispatch**: The AI Recommendation engine assesses available resources globally and allocates/recommends what is needed in the affected zone.
6. **Monitoring & Management**: The Admin monitors everything in real-time via the 3D Earth Dashboard, approving resource dispatches and broadcasting alerts to affected users.

---

## ✨ 2. Individual Feature Workflows

### 🎯 Feature 1: Crisis & Incident Management (`Feature1`, `Feature5_incidents`)
**Goal**: Handle the lifecycle of a crisis report.
- **Trigger**: User submits an incident via the frontend dashboard or mobile app.
- **Process**:
  1. Frontend validates the payload (location, type of disaster, media attachments).
  2. Data is sent to `POST /api/crisis/report`.
  3. Backend saves the initial report to Supabase with status `pending`.
  4. Webhooks/Triggers notify the `Severity Assessment Engine`.
- **Outcome**: Incident is logged on the global map for all relative authorities to see.

### 🧠 Feature 2: AI Severity Assessment & Intelligence (`Feature3`, `Feature8_AI_Intelligence`)
**Goal**: Automatically determine the severity score of an incoming incident.
- **Trigger**: New incident creation.
- **Process**:
  1. Incident details (text, location data, historical data) are fetched.
  2. The Google Gemini API processes the context to determine risk parameters.
  3. A severity score (1-10) and priority tag (`Low`, `Medium`, `High`, `Critical`) are assigned.
- **Outcome**: The incident is updated in real-time, instantly notifying administrators if the priority is `Critical`.

### 🚨 Feature 3: Emergency Services & Escalation (`Feature3_emergency`, `Feature4`)
**Goal**: Rapidly alert authorities using Twilio integrations.
- **Trigger**: A user presses the "SOS" button or a `Critical` severity incident is logged.
- **Process**:
  1. Geolocation of the user is captured.
  2. The Escalation Management service queries the nearest local authorities.
  3. Background workers trigger SMS and Automated Voice Calls via Twilio.
  4. Fallback routines are engaged if the primary contact fails to acknowledge the request.
- **Outcome**: Dispatch services receive actionable data instantly.

### 🗺️ Feature 4: ML Hotspot Detection & Seismic Monitoring (`Feature6_ML_Hotspot`, `Feature7_Seismic`)
**Goal**: Predict natural disasters and identify expanding risk zones.
- **Trigger**: Scheduled telemetry checks or sudden spikes in seismic API metrics.
- **Process**:
  1. Continuous ingestion of global seismic data.
  2. Machine learning models analyze clustering of incident data alongside environmental factors.
  3. System identifies "Hotspots" (areas with high probability of escalation).
- **Outcome**: Generating predictive alerts to preemptively evacuate areas or stage resources before the peak of a crisis.

### 🗣️ Feature 5: Voice Navigation & Multilingual Support (`Feature5_voice_nav`, `Feature4_multilingual`)
**Goal**: Provide hands-free and inclusive access in 5 different languages.
- **Trigger**: User starts a voice command or switches the app language.
- **Process (Voice)**: 
  1. Audio is recorded and converted to text.
  2. NLP service identifies the intent (e.g., "Call Ambulance" -> Intent: `emergency_ambulance`).
  3. Triggers the relevant UI action or backend API.
- **Process (Multilingual)**: 
  1. User selects language (English, Hindi, Marathi, Tamil, Bengali).
  2. Sarvam AI API translates dynamic user-generated content and news.
  3. UI falls back to localization dictionaries for static content.
- **Outcome**: A universally accessible, frictionless interface for victims in distress.

### 📦 Feature 6: AI Resource Recommendation (`Feature7_AI_Recommendation`, `Feature9_Resources`)
**Goal**: Ensure the right resources are requested for specific disaster types.
- **Trigger**: Successful severity assessment of a newly verified incident.
- **Process**:
  1. Identify disaster type (e.g., "Flood", "Earthquake").
  2. Cross-reference required resources (boats, tents, specific medical kits).
  3. Scan the resource database for available inventory nearby.
  4. Generate an automated resource allocation request.
- **Outcome**: Admins are presented with a 1-click approval prompt to dispatch the exact resources needed.

### 📰 Feature 7: Real-Time News Aggregation (`Feature2_news`)
**Goal**: Provide verified, localized disaster intelligence.
- **Trigger**: User navigates to the news feed or a background cron job executes.
- **Process**:
  1. Interrogates GNews API using specific disaster-related keywords and geofencing.
  2. Filters out noise and false information using secondary logic.
  3. Standardizes and translates the news articles into the user's preferred language.
- **Outcome**: A contextual, region-specific news dashboard that keeps users and admins informed of ground realities.

### 🛡️ Feature 8: Admin Operations & Control Center (`Feature_Admin`)
**Goal**: Global oversight and management of the platform.
- **Trigger**: Admin logs into the portal.
- **Process**:
  1. Dashboard loads the interactive 3D Earth Visualization showing all global incidents.
  2. Live telemetry websockets stream system health, API limits, and active incident counts.
  3. Admins review pending resource requests, false-positive reports, and system flags.
  4. Push Notifications (VAPID) can be broadcast manually to users within specific geozones.
- **Outcome**: A centralized, god-eye view empowering decision-makers to orchestrate life-saving operations efficiently.
