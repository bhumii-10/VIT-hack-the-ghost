import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import { getApiEndpoint } from '../lib/api';

const AIRecommendationPanel = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const url = getApiEndpoint('incidents');
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data.filter(inc => inc.current_state !== 'Resolved'));
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchRecommendations = async (incidentId) => {
    setLoading(true);
    try {
      const url = getApiEndpoint(`ai-recommendation/recommend/${incidentId}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error('Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentSelect = (incident) => {
    setSelectedIncident(incident);
    fetchRecommendations(incident.incident_id);
  };

  const handleApproveRecommendation = async (recommendationId, resourceId) => {
    try {
      const response = await fetch(getApiEndpoint('ai-recommendation/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.incident_id,
          resource_id: resourceId,
          recommendation_id: recommendationId,
          admin_action: 'approve'
        })
      });

      if (response.ok) {
        alert('Recommendation approved and resource dispatched!');
        // Refresh recommendations
        fetchRecommendations(selectedIncident.incident_id);
      } else {
        throw new Error('Failed to approve recommendation');
      }
    } catch (error) {
      console.error('Error approving recommendation:', error);
      alert('Error approving recommendation');
    }
  };

  const handleRejectRecommendation = async (recommendationId, resourceId) => {
    try {
      const response = await fetch(getApiEndpoint('ai-recommendation/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.incident_id,
          resource_id: resourceId,
          recommendation_id: recommendationId,
          admin_action: 'reject'
        })
      });

      if (response.ok) {
        alert('Recommendation rejected and logged.');
        // Refresh recommendations
        fetchRecommendations(selectedIncident.incident_id);
      } else {
        throw new Error('Failed to reject recommendation');
      }
    } catch (error) {
      console.error('Error rejecting recommendation:', error);
      alert('Error rejecting recommendation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SpotlightCard className="p-6" spotlightColor="rgba(147, 51, 234, 0.2)">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">AI Resource Recommendation</h2>
            <p className="text-gray-400 text-sm">Human-in-the-loop AI assistance for resource allocation</p>
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">How it works:</span>
          </div>
          <p className="text-xs text-gray-300">
            Select an active incident below to get AI-powered resource recommendations.
            The system analyzes distance, availability, capacity, and response history to suggest optimal resources.
            Final approval always remains with you.
          </p>
        </div>
      </SpotlightCard>

      {/* Incident Selection */}
      <SpotlightCard className="p-6" spotlightColor="rgba(59, 130, 246, 0.2)">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-400" />
          Select Active Incident
        </h3>

        {incidents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
            <p>No active incidents requiring resource allocation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.slice(0, 6).map((incident) => (
              <div
                key={incident.incident_id}
                onClick={() => handleIncidentSelect(incident)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedIncident?.incident_id === incident.incident_id
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-white/20 bg-black/30 hover:border-white/40'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{incident.incident_type}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${incident.severity_level >= 4 ? 'bg-red-500 text-black' :
                    incident.severity_level === 3 ? 'bg-orange-500 text-black' : 'bg-green-500 text-black'
                    }`}>
                    Lvl {incident.severity_level}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(incident.reported_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>

      {/* AI Recommendations */}
      {selectedIncident && (
        <SpotlightCard className="p-6" spotlightColor="rgba(34, 197, 94, 0.2)">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              AI Recommendations for {selectedIncident.incident_type}
            </h3>
            <button
              onClick={() => fetchRecommendations(selectedIncident.incident_id)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400">AI analyzing optimal resources...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-2 text-purple-400" />
              <p>No recommendations available for this incident</p>
              <p className="text-xs mt-1">This may be due to no available resources or system limitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="bg-black/30 border border-white/20 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-white">#{rec.rank}</span>
                        <span className="text-sm text-gray-400">Resource ID: {rec.resource_id}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-purple-400">AI Confidence:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all"
                              style={{ width: `${rec.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-white font-mono">{(rec.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-200 leading-relaxed">{rec.explanation}</p>
                        <p className="text-xs text-purple-300 mt-1 italic">
                          AI-assisted recommendation. Human approval required.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveRecommendation(index, rec.resource_id)}
                      className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      APPROVE & DISPATCH
                    </button>
                    <button
                      onClick={() => handleRejectRecommendation(index, rec.resource_id)}
                      className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      )}

      {/* System Status */}
      <SpotlightCard className="p-4" spotlightColor="rgba(107, 114, 128, 0.2)">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Brain className="w-4 h-4" />
            <span>AI Recommendation Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 text-xs font-mono">OPERATIONAL</span>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};

export default AIRecommendationPanel;