import API from "@/src/apis/axios";

const RideService = {
    // Ride CRUD
    createRide: async (payload) => {
        try {
            const response = await API.post("/v1/rides/create", payload);
            if (response.status !== 201) {
                throw new Error(response.data?.message || 'Failed to create ride');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to create ride:', error);
            throw error.response?.data || error;
        }
    },
    startSoloRide: async (location) => {
        try {
            const response = await API.post("/v1/rides/start-solo", location);
            if (response.status !== 201) {
                throw new Error(response.data?.message || 'Failed to start solo ride');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to start solo ride:', error);
            throw error.response?.data || error;
        }
    },
    getRideById: async (rideId) => {
        try {
            const response = await API.get(`/v1/rides/${rideId}`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch ride details');
            }
            // Check API-level status (backend may return 200 with error status)
            if (response.data?.status === 'error') {
                throw new Error(response.data?.message || 'Ride not found');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch ride details:', error);
            throw error.response?.data || error;
        }
    },
    updateRide: async (rideId, payload) => {
        try {
            const response = await API.put(`/v1/rides/${rideId}`, payload);
            if (response.status !== 200) {
                throw new Error('Failed to update ride');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update ride:', error);
            throw error.response?.data || error;
        }
    },
    startRide: async (rideId) => {
        return RideService.updateRide(rideId, { status: 'active' });
    },
    endRide: async (rideId) => {
        try {
            console.log(`RideService: Ending ride ${rideId}`);
            const response = await API.post(`/v1/rides/${rideId}/stop`, {});
            if (response.status !== 200) {
                console.error(`RideService: End ride failed with status ${response.status}`);
                throw new Error(response.data?.message || 'Failed to end ride');
            }
            console.log('RideService: Ride ended successfully');
            return response.data;
        } catch (error) {
            console.error('RideService: Failed to end ride:', error);
            throw error.response?.data || error;
        }
    },

    // Get rides the user has joined
    getMyRides: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status_filter', params.status);
            if (params.search) queryParams.append('search', params.search);
            if (params.sortBy) queryParams.append('sort_by', params.sortBy);
            if (params.sortOrder) queryParams.append('sort_order', params.sortOrder);
            if (params.includeCompleted !== undefined) {
                queryParams.append('include_completed', params.includeCompleted);
            }

            const url = `/v1/rides/my-rides${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await API.get(url);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch my rides:', error);
            throw error.response?.data || error;
        }
    },

    // Participation
    getJoinLink: async (rideId) => {
        try {
            const response = await API.get(`/v1/rides/${rideId}/join-link`);
            if (response.status !== 200) {
                throw new Error('Failed to get join link');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to get join link:', error);
            throw error.response?.data || error;
        }
    },
    joinRide: async (rideId, payload) => {
        // payload: { vehicle_info_id }
        try {
            const response = await API.post(`/v1/rides/${rideId}/join`, payload);
            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Failed to join ride');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to join ride:', error);
            throw error.response?.data || error;
        }
    },

    // Update vehicle for a ride (after joining)
    updateMyVehicle: async (rideId, vehicleInfoId) => {
        try {
            const response = await API.put(`/v1/rides/${rideId}/my-vehicle`, { vehicle_info_id: vehicleInfoId });
            if (response.status !== 200) {
                throw new Error('Failed to update vehicle');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            throw error.response?.data || error;
        }
    },
    getParticipants: async (rideId) => {
        try {
            const response = await API.get(`/v1/rides/${rideId}/participants`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch participants');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch participants:', error);
            throw error.response?.data || error;
        }
    },
    updateParticipantRole: async (rideId, participantId, payload) => {
        try {
            const response = await API.put(`/v1/rides/${rideId}/participants/${participantId}`, payload);
            if (response.status !== 200) {
                throw new Error('Failed to update participant role');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update participant role:', error);
            throw error.response?.data || error;
        }
    },

    // Active Ride Features
    checkIn: async (rideId, payload) => {
        // payload: { checkpoint_type, latitude, longitude }
        try {
            const response = await API.post(`/v1/rides/${rideId}/checkin`, payload);
            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Failed to check in');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to check in:', error);
            throw error.response?.data || error;
        }
    },

    // Add single checkpoint to a ride
    addCheckpoint: async (rideId, payload) => {
        // payload: { type, latitude, longitude, address }
        try {
            const response = await API.post(`/v1/rides/${rideId}/checkpoints/add`, payload);
            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Failed to add checkpoint');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to add checkpoint:', error);
            throw error.response?.data || error;
        }
    },

    // ============================================
    // PARTICIPANT MANAGEMENT (Admin Only)
    // ============================================

    // Mark/toggle payment for participant
    markPayment: async (rideId, participantId, amount) => {
        try {
            const response = await API.post(
                `/v1/rides/${rideId}/participants/${participantId}/mark-payment`,
                { amount }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to mark payment:', error);
            throw error.response?.data || error;
        }
    },

    // Mark attendance for participant
    markAttendance: async (rideId, participantId, status, checkpointType = 'meetup') => {
        try {
            const response = await API.post(
                `/v1/rides/${rideId}/participants/${participantId}/mark-attendance`,
                { status, checkpoint_type: checkpointType }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to mark attendance:', error);
            throw error.response?.data || error;
        }
    },

    // Remove participant from ride
    removeParticipant: async (rideId, participantId) => {
        try {
            const response = await API.delete(
                `/v1/rides/${rideId}/participants/${participantId}`
            );
            return response.data;
        } catch (error) {
            console.error('Failed to remove participant:', error);
            throw error.response?.data || error;
        }
    },

    // Toggle ban status for participant
    toggleBan: async (rideId, participantId) => {
        try {
            const response = await API.post(
                `/v1/rides/${rideId}/participants/${participantId}/toggle-ban`
            );
            return response.data;
        } catch (error) {
            console.error('Failed to toggle ban:', error);
            throw error.response?.data || error;
        }
    },

    // ============================================
    // LIVE RIDE APIs
    // ============================================

    // Check in at a checkpoint (auto-attendance)
    checkIn: async (rideId, location) => {
        try {
            const response = await API.post(`/v1/rides/${rideId}/checkin`, {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy
            });
            return response.data;
        } catch (error) {
            console.error('Failed to check in:', error);
            throw error.response?.data || error;
        }
    },

    // Update current location during active ride
    updateLocation: async (rideId, location) => {
        try {
            const response = await API.post(`/v1/rides/${rideId}/location`, {
                latitude: location.latitude,
                longitude: location.longitude,
                heading: location.heading,
                speed: location.speed,
                accuracy: location.accuracy
            });
            return response.data;
        } catch (error) {
            console.error('Failed to update location:', error);
            throw error.response?.data || error;
        }
    },

    // Send SOS/alert to all riders
    sendAlert: async (rideId, alertType, message = null, location = null) => {
        try {
            const payload = { alert_type: alertType };
            if (message) payload.message = message;
            if (location) {
                payload.latitude = location.latitude;
                payload.longitude = location.longitude;
            }
            const response = await API.post(`/v1/rides/${rideId}/alert`, payload);
            return response.data;
        } catch (error) {
            console.error('Failed to send alert:', error);
            throw error.response?.data || error;
        }
    },

    // Get activity feed for a ride
    getActivities: async (rideId, before = null, limit = 50) => {
        try {
            let url = `/v1/rides/${rideId}/activities?limit=${limit}`;
            if (before) url += `&before=${before}`;
            const response = await API.get(url);
            return response.data;
        } catch (error) {
            console.error('Failed to get activities:', error);
            throw error.response?.data || error;
        }
    },

    // Get all live ride data (activities, locations, checkpoints)
    getLiveData: async (rideId) => {
        try {
            const response = await API.get(`/v1/rides/${rideId}/live`);
            return response.data;
        } catch (error) {
            console.error('Failed to get live data:', error);
            throw error.response?.data || error;
        }
    }
};

export default RideService;

