/**
 * Enhanced PWA Offline Storage System
 * Comprehensive IndexedDB management for disaster data caching
 */

class OfflineStorageManager {
    constructor() {
        this.dbName = 'SankatSaathiDB';
        this.dbVersion = 3;
        this.db = null;
        this.isOnline = navigator.onLine;
        
        // Storage quotas and limits
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.maxIncidents = 1000;
        this.maxAlerts = 100;
        this.maxMapTiles = 500;
        
        // Initialize online/offline event listeners
        this.initializeNetworkListeners();
        
        // Initialize database
        this.initDB();
    }
    
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Incidents store
                if (!db.objectStoreNames.contains('incidents')) {
                    const incidentsStore = db.createObjectStore('incidents', { keyPath: 'incident_id' });
                    incidentsStore.createIndex('timestamp', 'reported_at');
                   (!db.objectStoreNames.contains('alerts')) {
                    const alertsStore = db.createObjectStore('alerts', { keyPath: 'alert_id' });
                    alertsStore.createIndex('timestamp', 'detection_time');
                    alertsStore.createIndex('severity', 'severity_level');
                    alertsStore.createIndex('type', 'disaster_type');
                }
                
                // User reports store (for offline incident reporting)
                if (!db.objectStoreNames.contains('userReports')) {
                    const reportsStore = db.createObjectStore('userReports', { keyPath: 'id', autoIncrement: true });
                    reportsStore.createIndex('timestamp', 'created_at');
                    reportsStore.createIndex('synced', 'synced');
                }
                
                // Severity assessments cache
                if (!db.objectStoreNames.contains('severityCache')) {
                    const severityStore = db.createObjectStore('severityCache', { keyPath: 'location_key' });
                    severityStore.createIndex('timestamp', 'timestamp');
                    severityStore.createIndex('expiry', 'expires_at');
                }
                
                // Emergency contacts cache
                if (!db.objectStoreNames.contains('emergencyContacts')) {
                    const contactsStore = db.createObjectStore('emergencyContacts', { keyPath: 'service' });
                }
                
                // News cache
                if (!db.objectStoreNames.contains('newsCache')) {
                    const newsStore = db.createObjectStore('newsCache', { keyPath: 'id' });
                    newsStore.createIndex('timestamp', 'published_at');
                    newsStore.createIndex('category', 'category');
                }
                
                // Sync queue for offline actions
                if (!db.objectS