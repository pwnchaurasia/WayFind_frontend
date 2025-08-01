import API from "@/src/apis/axios";


const UserService = {
    updateCurrentUserProfile: async (payload) => {
        
        try{
            const response = await API.put("/v1/users/me", payload)
            console.log('Updating user profile with payload:', response);
            if (response.status !== 200) {
                throw new Error('Failed to update user profile');
            }
            console.log('User profile updated successfully');
            // Optionally update device last active time
            return response.data

        } catch (error) {
            console.error('Failed to update user profile:', error);
            throw error.response?.data || error;
        }
    },
    getCurrentUserProfile: async () => {
        
        try {
            const response = await API.get("/v1/users/me");
            if (response.status !== 200) {
                throw new Error('Failed to fetch user profile');
            }
            return response.data; // Return just the data on success
        } catch (error) {
            console.error('Failed to get user profile:', error);
            throw error.response?.data || error;
        }
    },
    getCurrentUserGroups: async () => {
        try {
            const response = await API.get("/v1/users/me/groups");
            
            if (response.status !== 200) {
                throw new Error('Failed to fetch user groups');
            }
            return response.data;
            
        } catch (error) {
            console.error('Failed to get user groups:', error);
            throw error.response?.data || error;
            
        }

    },
    updateDeviceLastActive: async () => {
        try {
            const response = await API.put('/v1/users/me/device-info/last-active');
            if (response.status !== 200) {
                throw new Error('Failed to update device last active');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update device last active:', error);
            throw error.response?.data || error;
        }
    },
    updateUsersDeviceInfo: async (deviceInfo) => {
        try {
            const response = await API.post('/v1/users/me/device-info', deviceInfo);
            if (response.status !== 200) {
                throw new Error('Failed to update device info');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update device info:', error);
            throw error.response?.data || error;
        }
    },
    updateUserLocation: async (locationData) => {
        try {
            const response = await API.put('/v1/users/me/location', locationData);
            if (response.status !== 200) {
                throw new Error('Failed to update user location');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update user location:', error);
            throw error.response?.data || error;
        }
    },

};

export default UserService;