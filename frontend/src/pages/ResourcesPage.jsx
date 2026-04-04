import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, RefreshCw, Search, Package, MapPin, Phone, 
    Eye, Navigation, Truck, CheckCircle, Clock, Activity 
} from 'lucide-react';
import { getApiEndpoint } from '../lib/api';
import SpotlightCard from '../components/SpotlightCard';
import { useLocation } from '../context/LocationContext';

const tabs = [
    { id: 'resources', label: 'Resources', icon: Package },
    { id: 'requests', label: 'Requests', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: Activity }
];

const resourceTypeIcons = {
    medical: Activity,
    rescue: LifeBuoy => Activity, // Fallback as LifeBuoy might be missing
    shelter: Shield => Activity,
    supplies: Package,
    transport: Truck
};

const priorityColors = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400'
};

const ResourcesPage = () => {
    const { location } = useLocation();
    const [activeTab, setActiveTab] = useState('resources');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [newRequest, setNewRequest] = useState({
        resource_type: '',
        quantity_needed: 1,
        priority: 'medium',
        description: ''
    });

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchResources(),
            fetchRequests(),
            fetchAllocations(),
            fetchAnalytics()
        ]);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const fetchResources = async () => {
        try {
            const response = await fetch(getApiEndpoint('resources/available'));
            if (response.ok) {
                const data = await response.json();
                setResources(data.resources || []);
            }
        } catch (error) {
            console.error('Error fetching resources:', error);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await fetch(getApiEndpoint('resources/requests'));
            if (response.ok) {
                const data = await response.json();
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const fetchAllocations = async () => {
        try {
            const response = await fetch(getApiEndpoint('resources/allocations'));
            if (response.ok) {
                const data = await response.json();
                setAllocations(data.allocations || []);
            }
        } catch (error) {
            console.error('Error fetching allocations:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(getApiEndpoint('resources/analytics'));
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const submitResourceRequest = async () => {
        if (!location?.latitude || !location?.longitude) {
            alert('Location is required to submit a resource request');
            return;
        }

        try {
            const requestData = {
                request_id: `REQ_${Date.now()}`,
                incident_id: `INC_${Date.now()}`,
                resource_type: newRequest.resource_type,
                quantity_needed: parseInt(newRequest.quantity_needed),
                priority: newRequest.priority,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude
                },
                requested_by: 'user',
                description: newRequest.description
            };

            const response = await fetch(getApiEndpoint('resources/request'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Resource request submitted successfully! Request ID: ${result.request_id}`);
                setShowRequestModal(false);
                setNewRequest({
                    resource_type: '',
                    quantity_needed: 1,
                    priority: 'medium',
                    description: ''
                });
                fetchRequests();
            } else {
                throw new Error('Failed to submit request');
            }
        } catch (error) {
            alert(`Error submitting request: ${error.message}`);
        }
    };

    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || resource.type === filterType;
        return matchesSearch && matchesFilter;
    });

    if (loading && resources.length === 0) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-crisis-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-crisis-red font-mono">Loading Resource Management...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-crisis-red via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                            RESOURCE MANAGEMENT
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Emergency Resource Allocation & Coordination</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-crisis-red hover:bg-red-600 text-white rounded-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Request Resources
                        </button>
                        <button
                            onClick={fetchAllData}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === tab.id
                                        ? 'bg-crisis-red text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <IconComponent className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'resources' && (
                    <motion.div
                        key="resources"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Search and Filter */}
                        <div className="flex gap-4 items-center">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search resources..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-crisis-red outline-none"
                                />
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-crisis-red outline-none"
                            >
                                <option value="all">All Types</option>
                                <option value="medical">Medical</option>
                                <option value="rescue">Rescue</option>
                                <option value="shelter">Shelter</option>
                                <option value="supplies">Supplies</option>
                                <option value="transport">Transport</option>
                            </select>
                        </div>

                        {/* Resources Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.map((resource) => {
                                const IconComponent = resourceTypeIcons[resource.type] || Package;
                                const utilizationRate = ((resource.quantity - resource.available) / resource.quantity) * 100;

                                return (
                                    <SpotlightCard
                                        key={resource.resource_id}
                                        className="p-6"
                                        spotlightColor="rgba(34, 197, 94, 0.2)"
                                    >
                                        <div className="space-y-4">
                                            {/* Resource Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                                        <IconComponent className="w-6 h-6 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">{resource.name}</h3>
                                                        <p className="text-sm text-gray-400 capitalize">{resource.type}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold ${resource.status === 'available' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                                                    }`}>
                                                    {resource.status.toUpperCase()}
                                                </div>
                                            </div>

                                            {/* Availability */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Available</span>
                                                    <span className="text-white font-mono">{resource.available} / {resource.quantity}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${(resource.available / resource.quantity) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Utilization: {utilizationRate.toFixed(1)}%
                                                </div>
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <MapPin className="w-4 h-4" />
                                                <span>{resource.location.latitude.toFixed(4)}, {resource.location.longitude.toFixed(4)}</span>
                                            </div>

                                            {/* Contact */}
                                            {resource.contact_info && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-blue-400" />
                                                    <span className="text-blue-400">{resource.contact_info}</span>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-all">
                                                    <Eye className="w-4 h-4 inline mr-1" />
                                                    Details
                                                </button>
                                                <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-all">
                                                    <Navigation className="w-4 h-4 inline mr-1" />
                                                    Navigate
                                                </button>
                                            </div>
                                        </div>
                                    </SpotlightCard>
                                );
                            })}
                        </div>

                        {filteredResources.length === 0 && (
                            <div className="text-center text-gray-500 py-20 font-mono">
                                {searchTerm || filterType !== 'all' ? 'NO RESOURCES MATCH YOUR FILTERS' : 'NO RESOURCES AVAILABLE'}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'requests' && (
                    <motion.div
                        key="requests"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Requests List */}
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <SpotlightCard
                                    key={request.request_id}
                                    className="p-6"
                                    spotlightColor="rgba(59, 130, 246, 0.2)"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        <div>
                                            <h3 className="font-bold text-white mb-2">Request Details</h3>
                                            <div className="space-y-1 text-sm">
                                                <div><span className="text-gray-400">ID:</span> <span className="text-white font-mono">{request.request_id}</span></div>
                                                <div><span className="text-gray-400">Type:</span> <span className="text-white capitalize">{request.resource_type}</span></div>
                                                <div><span className="text-gray-400">Quantity:</span> <span className="text-white">{request.quantity_needed}</span></div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white mb-2">Priority & Status</h3>
                                            <div className="space-y-2">
                                                <div className={`px-2 py-1 rounded text-xs font-bold inline-block ${priorityColors[request.priority]}`}>
                                                    {request.priority.toUpperCase()}
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold block w-fit ${request.status === 'approved' ? 'bg-green-500 text-black' :
                                                        request.status === 'pending' ? 'bg-yellow-500 text-black' :
                                                            'bg-gray-500 text-white'
                                                    }`}>
                                                    {request.status.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white mb-2">Location</h3>
                                            <div className="text-sm text-gray-400">
                                                <div>{request.location.latitude.toFixed(4)}</div>
                                                <div>{request.location.longitude.toFixed(4)}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white mb-2">Timestamp</h3>
                                            <div className="text-sm text-gray-400">
                                                {new Date(request.requested_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            ))}
                        </div>

                        {requests.length === 0 && (
                            <div className="text-center text-gray-500 py-20 font-mono">
                                NO RESOURCE REQUESTS FOUND
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'analytics' && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Analytics Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <SpotlightCard className="p-6" spotlightColor="rgba(34, 197, 94, 0.2)">
                                <div className="text-center">
                                    <Package className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white">{analytics.resource_summary?.total_resources || 0}</p>
                                    <p className="text-sm text-gray-400">Total Resources</p>
                                </div>
                            </SpotlightCard>

                            <SpotlightCard className="p-6" spotlightColor="rgba(59, 130, 246, 0.2)">
                                <div className="text-center">
                                    <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white">{analytics.resource_summary?.available_resources || 0}</p>
                                    <p className="text-sm text-gray-400">Available</p>
                                </div>
                            </SpotlightCard>

                            <SpotlightCard className="p-6" spotlightColor="rgba(245, 158, 11, 0.2)">
                                <div className="text-center">
                                    <Truck className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white">{analytics.resource_summary?.deployed_resources || 0}</p>
                                    <p className="text-sm text-gray-400">Deployed</p>
                                </div>
                            </SpotlightCard>

                            <SpotlightCard className="p-6" spotlightColor="rgba(168, 85, 247, 0.2)">
                                <div className="text-center">
                                    <Activity className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white">{analytics.resource_summary?.utilization_rate || '0%'}</p>
                                    <p className="text-sm text-gray-400">Utilization</p>
                                </div>
                            </SpotlightCard>
                        </div>

                        {/* Performance Metrics */}
                        <SpotlightCard className="p-6" spotlightColor="rgba(34, 197, 94, 0.2)">
                            <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <Clock className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-white">{analytics.performance_metrics?.avg_response_time || 'N/A'}</p>
                                    <p className="text-sm text-gray-400">Avg Response Time</p>
                                </div>
                                <div className="text-center">
                                    <CheckCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-white">{analytics.performance_metrics?.allocation_success_rate || 'N/A'}</p>
                                    <p className="text-sm text-gray-400">Success Rate</p>
                                </div>
                                <div className="text-center">
                                    <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-white">{analytics.request_summary?.completion_rate || 'N/A'}</p>
                                    <p className="text-sm text-gray-400">Completion Rate</p>
                                </div>
                            </div>
                        </SpotlightCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resource Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <SpotlightCard className="p-6 max-w-md w-full mx-4" spotlightColor="rgba(239, 68, 68, 0.3)">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white">Request Resources</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Resource Type</label>
                                <select
                                    value={newRequest.resource_type}
                                    onChange={(e) => setNewRequest({ ...newRequest, resource_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-crisis-red outline-none"
                                >
                                    <option value="">Select Type</option>
                                    <option value="medical">Medical</option>
                                    <option value="rescue">Rescue</option>
                                    <option value="shelter">Shelter</option>
                                    <option value="supplies">Supplies</option>
                                    <option value="transport">Transport</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Quantity Needed</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newRequest.quantity_needed}
                                    onChange={(e) => setNewRequest({ ...newRequest, quantity_needed: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-crisis-red outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                                <select
                                    value={newRequest.priority}
                                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-crisis-red outline-none"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={newRequest.description}
                                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                                    placeholder="Additional details about the resource request..."
                                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-crisis-red outline-none resize-none h-20"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={submitResourceRequest}
                                    disabled={!newRequest.resource_type}
                                    className="flex-1 py-2 bg-crisis-red hover:bg-red-600 disabled:bg-gray-600 text-white rounded font-medium transition-all"
                                >
                                    Submit Request
                                </button>
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </SpotlightCard>
                </div>
            )}
        </div>
    );
};

export default ResourcesPage;