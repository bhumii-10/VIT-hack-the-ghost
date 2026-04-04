import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle, XCircle, MapPin, Clock, Activity, 
    Zap, Target, Info, Truck, Users, Phone
} from 'lucide-react';
import SpotlightCard from './SpotlightCard';

const ResourceRecommendationCard = ({ 
    recommendation, 
    onApprove, 
    onReject, 
    isProcessing = false,
    adminId 
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const handleApprove = async () => {
        setActionLoading('approve');
        try {
            await onApprove(recommendation.resource_id, adminId);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        const reason = prompt('Reason for rejection (optional):') || 'No reason provided';
        setActionLoading('reject');
        try {
            await onReject(recommendation.resource_id, adminId, reason);
        } finally {
            setActionLoading(null);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'text-green-400';
        if (confidence >= 0.6) return 'text-yellow-400';
        return 'text-orange-400';
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'bg-yellow-500 text-black';
        if (rank === 2) return 'bg-gray-400 text-black';
        if (rank === 3) return 'bg-orange-600 text-white';
        return 'bg-blue-600 text-white';
    };

    const getResourceIcon = (type) => {
        switch (type) {
            case 'medical': return '🚑';
            case 'rescue': return '🚒';
            case 'transport': return '🚌';
            case 'shelter': return '🏠';
            case 'supplies': return '📦';
            default: return '🔧';
        }
    };

    return (
        <SpotlightCard 
            className="p-6 mb-4" 
            spotlightColor={`rgba(${recommendation.rank === 1 ? '34, 197, 94' : '59, 130, 246'}, 0.2)`}
        >
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">{getResourceIcon(recommendation.resource_type)}</div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{recommendation.resource_name}</h3>
                            <p className="text-gray-400 text-sm capitalize">{recommendation.resource_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankColor(recommendation.rank)}`}>
                            #{recommendation.rank}
                        </div>
                        <div className={`text-sm font-mono ${getConfidenceColor(recommendation.confidence)}`}>
                            {(recommendation.confidence * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>

                {/* AI Explanation */}
                <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                    <div className="flex items-start gap-2">
                        <div className="text-blue-400 mt-1">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {recommendation.explanation}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <MapPin className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Distance</p>
                        <p className="text-sm font-mono text-white">
                            {(recommendation.metrics.distance_score * 100).toFixed(0)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <Clock className="w-4 h-4 text-green-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Response</p>
                        <p className="text-sm font-mono text-white">
                            {(recommendation.metrics.response_time_score * 100).toFixed(0)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Capacity</p>
                        <p className="text-sm font-mono text-white">{recommendation.capacity}</p>
                    </div>
                    <div className="text-center">
                        <Activity className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Suitability</p>
                        <p className="text-sm font-mono text-white">
                            {(recommendation.metrics.overall_suitability * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>

                {/* Detailed Metrics (Expandable) */}
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/20 p-4 rounded-lg border border-white/5"
                    >
                        <h4 className="text-sm font-bold text-white mb-3">Detailed Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-gray-400">Location</p>
                                <p className="text-white font-mono">
                                    {recommendation.latitude.toFixed(4)}, {recommendation.longitude.toFixed(4)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400">Status</p>
                                <p className="text-green-400 capitalize">{recommendation.availability_status}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Distance Score</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(1 - recommendation.metrics.distance_score) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-mono">
                                        {((1 - recommendation.metrics.distance_score) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-400">Idle Duration</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${recommendation.metrics.idle_duration_score * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-mono">
                                        {(recommendation.metrics.idle_duration_score * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReject}
                            disabled={isProcessing || actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-all text-sm font-medium"
                        >
                            {actionLoading === 'reject' ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <XCircle className="w-4 h-4" />
                            )}
                            Reject
                        </button>

                        <button
                            onClick={handleApprove}
                            disabled={isProcessing || actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-all text-sm font-medium"
                        >
                            {actionLoading === 'approve' ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            Approve & Deploy
                        </button>
                    </div>
                </div>

                {/* Human-in-the-Loop Notice */}
                <div className="text-xs text-gray-500 text-center border-t border-white/10 pt-3">
                    🤖 AI-assisted recommendation • Human approval required • Decision support only
                </div>
            </div>
        </SpotlightCard>
    );
};

export default ResourceRecommendationCard;