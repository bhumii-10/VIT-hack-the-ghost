# SankatSaathi (Crisis Companion) - Technical Showcase

## 🛡️ Project Philosophy
SankatSaathi is an **Autonomous Situational Intelligence Platform** designed to solve the critical "Information Gap" during disasters. Unlike traditional systems that rely on manual inputs, SankatSaathi uses live telemetry, ML-driven hotspots, and a decentralized database shim to provide real-time coordination when every second counts.

---

## 🚀 Core Features Matrix

### 1. Context-Aware Severity Intelligence (The "Brain")
*   **Module:** `Feature3` / `SeverityEngine`
*   **Technology:** Python FastAPI + Contextual ML Logic
*   **Description:** An invisible intelligence layer that computes live risk without manual user input.
*   **Mechanism:** It triangulates:
    *   **Live GPS Telemetry:** Real-time movement tracking.
    *   **Environmental Context:** Real-time weather and hazard data.
    *   **Incident Density:** Active database queries of nearby emergencies.
    *   **Temporal Risk:** Time-of-day risk multipliers.
*   **Judge's Insight:** It provides a 0.0 to 1.0 continuous severity score with trend analysis (Increasing/Decreasing).

### 2. ML Hotspot Detection (Geospatial Analysis)
*   **Module:** `Feature6` / `HotspotPage`
*   **Technology:** React + Leaflet + ML Clustering
*   **Description:** AI-powered identification of emergency clusters.
*   **Mechanism:** Analyzes the 'density' of reports across coordinates to identify "Danger Zones" (Red) versus "Safe Zones" (Green) in real-time.
*   **Judge's Insight:** Helps rescue teams identify where a single event is escalating into a massive cluster (e.g., bridge collapse or multi-point floods).

### 3. Adaptive Escalation Engine (State Management)
*   **Module:** `Feature4` / `EscalationEngine`
*   **Technology:** Integrated Feature 3 + Feature 4 logic
*   **Description:** Automatically manages the transition through crisis states: `NORMAL` → `WATCH` → `PREPAREDNESS` → `CRISIS`.
*   **Mechanism:** When the Severity Engine (Feature 3) detects a threshold breach (e.g., >0.6), the Escalation Engine automatically switches to 'CRISIS' mode, alerts all active responders, and prepares resource allocation.

### 4. Real-Time Crisis Dispatch & Collaboration
*   **Module:** `Feature1` / `CrisisDashboard`
*   **Technology:** Supabase Realtime + WebSockets
*   **Description:** End-to-end incident management.
*   **Mechanism:** Includes secure real-time chat rooms for every incident, live status tracking, and instant broadcast notifications.
*   **Judge's Insight:** Uses a custom **Supabase Shim builder pattern** to ensure zero-crash execution even during heavy load.

### 5. Multi-Modal "Hey SankatSaathi" Voice Assistant
*   **Module:** `Feature5` / `VoiceRouter`
*   **Technology:** Web Speech API + NLP Processing
*   **Description:** Hands-free emergency reporting.
*   **Mechanism:** Triggered by "Hey SankatSaathi", then processes natural language commands like *"Place call to fire brigade"* or *"Show me active alerts"*.
*   **Judge's Insight:** Vital for first responders whose hands are busy in rescue scenarios.

### 6. Resource Allocation & Tracking
*   **Module:** `Feature9` / `ResourcesPage`
*   **Technology:** Live Asset Management
*   **Description:** Intelligent tracking of Ambulances, Fire Trucks, and Police units.
*   **Mechanism:** Connects resource availability with nearby incident severity to prioritize deployment.

---

## 🛠️ Technological Stack
*   **Frontend:** Vite/React, Tailwind CSS, Framer Motion (Animations), Three.js (Digital Twin Earth).
*   **Backend:** Python 3.12, FastAPI (High Performance), Uvicorn.
*   **Database:** Supabase with Realtime Subscriptions & custom Builder Shim.
*   **AI/ML:** Custom logic for severity scoring, geospatial clustering for hotspots, and sentiment analysis for news.

## ⚡ The "Real-Time" Architecture
Every component in SankatSaathi is wired for **Live Telemetry**:
1.  **30-Second Polling:** AI engines refresh data continuously.
2.  **WebSockets:** Incident chat and alerts are instantaneous via Supabase Realtime.
3.  **GPS Integration:** The system follows you. As you move, your risk assessment and hotspot map update to reflect your new neighborhood.

---
**SankatSaathi: Because in a crisis, data shouldn't be static.**
