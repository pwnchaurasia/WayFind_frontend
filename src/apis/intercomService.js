/**
 * Intercom Service - API calls for Universal Intercom feature
 * Handles LiveKit token generation and Lead management
 */
import API from "@/src/apis/axios";

const IntercomService = {
    /**
     * Get LiveKit token to connect to ride's intercom
     * @param {string} rideId - The ride UUID
     * @returns {Promise} Token response with LiveKit credentials
     */
    getIntercomToken: async (rideId) => {
        try {
            const response = await API.get(`/v1/rides/${rideId}/intercom/token`);
            if (response.status !== 200) {
                throw new Error('Failed to get intercom token');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to get intercom token:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Get current intercom status for a ride
     * @param {string} rideId - The ride UUID
     * @returns {Promise} Status response with Lead info
     */
    getIntercomStatus: async (rideId) => {
        try {
            const response = await API.get(`/v1/rides/${rideId}/intercom/status`);
            if (response.status !== 200) {
                throw new Error('Failed to get intercom status');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to get intercom status:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Set a participant as the Lead (Admin only)
     * @param {string} rideId - The ride UUID
     * @param {string} userId - The user UUID to become Lead
     * @returns {Promise} Result with new Lead info
     */
    setLead: async (rideId, userId) => {
        try {
            const response = await API.post(`/v1/rides/${rideId}/set-lead`, {
                user_id: userId
            });
            if (response.status !== 200) {
                throw new Error('Failed to set lead');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to set lead:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Remove the current Lead (Admin only)
     * @param {string} rideId - The ride UUID
     * @returns {Promise} Result
     */
    removeLead: async (rideId) => {
        try {
            const response = await API.post(`/v1/rides/${rideId}/remove-lead`);
            if (response.status !== 200) {
                throw new Error('Failed to remove lead');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to remove lead:', error);
            throw error.response?.data || error;
        }
    },
};

export default IntercomService;
