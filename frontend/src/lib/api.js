/**
 * API Configuration for SankatSaathi
 * Handles both local development and production deployment
 */

// Get base API URL from environment or default to /api for production
const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;

    // Check if we are in production
    if (import.meta.env.PROD) {
        // If envUrl is not set or is just '/api', default to the Render backend
        if (!envUrl || envUrl === '/api') {
            return 'https://sankatsaathi.onrender.com/api';
        }
    }

    // In development or if explicitly set
    if (!envUrl) {
        return 'http://localhost:8000/api'; // Default local backend
    }

    // Remove trailing slash
    return envUrl.replace(/\/$/, '');
};

export const API_BASE_URL = getApiUrl();

/**
 * Build full API endpoint URL
 * @param {string} endpoint - API endpoint path (e.g., '/crisis/active')
 * @returns {string} Full URL
 */
export const getApiEndpoint = (endpoint) => {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.replace(/^\//, '');

    // Ensure API_BASE_URL does not end with /
    const baseUrl = API_BASE_URL.replace(/\/$/, '');

    return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Fetch wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} Response data
 */
export const apiFetch = async (endpoint, options = {}) => {
    const url = getApiEndpoint(endpoint);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Fetch Error (${endpoint}):`, error);
        throw error;
    }
};

// Export for debugging
console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD
});
