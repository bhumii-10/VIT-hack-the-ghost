import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../lib/api';

const IncidentReport = ({ onSuccess }) => {
    const { user } = useAuth();
    const { location: gpsLocation, hasLocation, requestLocation } = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'medical', // Default
        severity: 'medium'
    });
    const [image, setImage] = useState(null);

    // Auto-request location when component mounts
    useEffect(() => {
        if (!hasLocation) {
            requestLocation(false); // Don't show toast on auto-request
        }
    }, [hasLocation, requestLocation]);

    const handleLocation = () => {
        requestLocation(true); // Show toast when manually requested
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("Authentication Error: You must be logged in to report an incident.");
            return;
        }

        if (!hasLocation || !gpsLocation) {
            alert('Please enable location services and click "Get GPS"');
            return;
        }
        setLoading(true);

        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('crisis_type', formData.type);
        formDataToSend.append('severity', formData.severity);
        formDataToSend.append('latitude', gpsLocation.latitude);
        formDataToSend.append('longitude', gpsLocation.longitude);
        formDataToSend.append('reporter_id', user.id); // Validated above
        if (image) formDataToSend.append('image', image);

        try {
            // Point to FastAPI Backend
            const url = getApiEndpoint('crisis/alert');
            const response = await fetch(url, {
                method: 'POST',
                body: formDataToSend
            });
            const data = await response.json();

            if (response.ok) {
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    type: 'medical',
                    severity: 'medium'
                });
                setImage(null);

                // Use 'incident_id' from backend (aligned with Python return)
                const newId = data.incident_id || data.crisis_id;

                if (onSuccess) {
                    onSuccess(newId);
                } else {
                    alert('Incident Reported! ID: ' + newId);
                    navigate('/intelligence');
                }

            } else {
                alert('Error: ' + (data.detail || 'Unknown error occurred'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to report incident: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 text-white rounded-lg shadow-xl border border-red-500/30">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Report an Incident</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Location */}
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                    <span>Location: {hasLocation && gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'Not set'}</span>
                    <button type="button" onClick={handleLocation} className="text-sm bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">
                        📍 Get GPS
                    </button>
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm mb-1">Type</label>
                    <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2"
                    >
                        <option value="medical">Medical Emergency</option>
                        <option value="fire">Fire</option>
                        <option value="accident">Road Accident</option>
                        <option value="crime">Crime / Violence</option>
                        <option value="natural_disaster">Natural Disaster</option>
                    </select>
                </div>

                {/* Title */}
                <input
                    type="text"
                    placeholder="Short Title (e.g., Fire at Main St)"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                />

                {/* Description */}
                <textarea
                    placeholder="Describe the situation..."
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 h-24"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />

                {/* Image */}
                <div>
                    <label className="block text-sm mb-1">Photo (Optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setImage(e.target.files[0])}
                        className="w-full bg-gray-800 text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition-colors"
                >
                    {loading ? 'Sending Alert...' : '🚨 SEND HELP ALERT'}
                </button>
            </form>
        </div>
    );
};

export default IncidentReport;
