#!/usr/bin/env node

/**
 * SankatSaathi Deployment Verification Script
 * Tests all 9 features and their API endpoints
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// All API endpoints to test
const ENDPOINTS = [
    // Feature 1: Crisis Management
    { path: '/api/crisis/status', method: 'GET', feature: 'Crisis Management' },
    
    // Feature 2: News Aggregation
    { path: '/api/news', method: 'GET', feature: 'News Aggregation' },
    
    // Feature 3: Severity Intelligence
    { path: '/api/severity/system/status', method: 'GET', feature: 'Severity Intelligence' },
    
    // Feature 3 Emergency
    { path: '/api/emergency/status', method: 'GET', feature: 'Emergency Services' },
    
    // Feature 4: Escalation Management
    { path: '/api/escalation/states', method: 'GET', feature: 'Escalation Management' },
    
    // Feature 5: Incidents
    { path: '/api/incidents', method: 'GET', feature: 'Incident Management' },
    
    // Feature 5: Voice Navigation
    { path: '/api/voice/status', method: 'GET', feature: 'Voice Navigation' },
    
    // Feature 6: ML Hotspot
    { path: '/api/hotspot/status', method: 'GET', feature: 'ML Hotspot Detection' },
    
    // Feature 7: Seismic Monitoring
    { path: '/api/seismic/status', method: 'GET', feature: 'Seismic Monitoring' },
    
    // Feature 8: AI Intelligence
    { path: '/api/intelligence/status', method: 'GET', feature: 'AI Disaster Intelligence' },
    
    // Feature 9: Resource Management
    { path: '/api/resources/status', method: 'GET', feature: 'Resource Management' },
    
    // Feature 7: AI-Assisted Resource Recommendation
    { path: '/api/recommend/status', method: 'GET', feature: 'AI Resource Recommendation' },
    { path: '/api/recommend/analytics', method: 'GET', feature: 'AI Recommendation Analytics' },
    
    // Admin Dashboard
    { path: '/api/admin/stats', method: 'GET', feature: 'Admin Dashboard' },
    
    // Health Check
    { path: '/api/health', method: 'GET', feature: 'System Health' },
    { path: '/', method: 'GET', feature: 'Root API' }
];

function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const url = new URL(endpoint.path, BASE_URL);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, { method: endpoint.method, timeout: 5000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ...endpoint,
                    status: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    response: data.length > 0 ? data.substring(0, 100) + '...' : 'No response body'
                });
            });
        });
        
        req.on('error', (err) => {
            resolve({
                ...endpoint,
                status: 'ERROR',
                success: false,
                response: err.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                ...endpoint,
                status: 'TIMEOUT',
                success: false,
                response: 'Request timeout after 5 seconds'
            });
        });
        
        req.end();
    });
}

async function verifyDeployment() {
    console.log('🚨 SankatSaathi Deployment Verification');
    console.log('=====================================');
    console.log(`Testing backend at: ${BASE_URL}`);
    console.log('');
    
    const results = [];
    let successCount = 0;
    
    for (const endpoint of ENDPOINTS) {
        process.stdout.write(`Testing ${endpoint.feature}... `);
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        if (result.success) {
            console.log('✅ PASS');
            successCount++;
        } else {
            console.log(`❌ FAIL (${result.status})`);
        }
    }
    
    console.log('');
    console.log('📊 VERIFICATION RESULTS');
    console.log('=======================');
    console.log(`Total Endpoints: ${ENDPOINTS.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${ENDPOINTS.length - successCount}`);
    console.log(`Success Rate: ${((successCount / ENDPOINTS.length) * 100).toFixed(1)}%`);
    
    console.log('');
    console.log('📋 DETAILED RESULTS');
    console.log('===================');
    
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.feature}: ${result.status}`);
        if (!result.success) {
            console.log(`   Error: ${result.response}`);
        }
    });
    
    console.log('');
    
    if (successCount === ENDPOINTS.length) {
        console.log('🎉 ALL SYSTEMS OPERATIONAL - READY FOR PRODUCTION!');
        console.log('');
        console.log('🚀 DEPLOYMENT STATUS: FULLY OPERATIONAL');
        console.log('- All 9 features responding correctly');
        console.log('- Backend API endpoints working');
        console.log('- System health checks passing');
        console.log('- Ready for judge demonstration');
    } else {
        console.log('⚠️  SOME SYSTEMS NEED ATTENTION');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('1. Check failed endpoints');
        console.log('2. Verify backend is running');
        console.log('3. Check environment variables');
        console.log('4. Review error logs');
    }
    
    console.log('');
    console.log('🎯 ADMIN ACCESS:');
    console.log('Email: admin@sankatsaathi.com');
    console.log('Password: SankatSaathi@2024');
    
    process.exit(successCount === ENDPOINTS.length ? 0 : 1);
}

// Run verification
verifyDeployment().catch(console.error);