import API from "@/src/apis/axios";


const UserService = {
    updateCurrentUserProfile: async (payload) => {
        try {
            const response = await API.put("/v1/users/me", payload)
            console.log('Updating user profile with payload:', response);
            if (response.status !== 200 && response.status !== 202) {
                throw new Error('Failed to update user profile');
            }
            console.log('User profile updated successfully');
            // Optionally update device last active time
            return response.data

        } catch (error) {
            debugger
            console.error('Failed to update user profile:', error);
            throw error.response?.data || error;
        }
    },
    uploadProfilePicture: async (imageUri) => {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('file', { uri: imageUri, name: filename, type });

            // Post to avatar endpoint (adjust if backend uses different path)
            // Assuming /v1/users/me/avatar or similar handles multipart
            // If backend uses generic upload, standard might be /v1/users/me/profile-picture
            const response = await API.post("/v1/users/me/avatar", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Failed to upload profile picture');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to upload profile picture:', error);
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

    // Vehicle Management
    getUserVehicles: async () => {
        try {
            const response = await API.get('/v1/users/me/vehicles');
            if (response.status !== 200) {
                throw new Error('Failed to fetch user vehicles');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to get user vehicles:', error);
            throw error.response?.data || error;
        }
    },
    addVehicle: async (vehicleData) => {
        console.log('Adding vehicle with data:', vehicleData);
        try {
            const response = await API.post('/v1/users/me/vehicles', vehicleData);
            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Failed to add vehicle');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to add vehicle:', error);
            throw error.response?.data || error;
        }
    },
    updateVehicle: async (vehicleId, vehicleData) => {
        try {
            const response = await API.put(`/v1/users/me/vehicles/${vehicleId}`, vehicleData);
            if (response.status !== 200) {
                throw new Error('Failed to update vehicle');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            throw error.response?.data || error;
        }
    },
    deleteVehicle: async (vehicleId) => {
        try {
            const response = await API.delete(`/v1/users/me/vehicles/${vehicleId}`);
            if (response.status !== 200 && response.status !== 204) {
                throw new Error('Failed to delete vehicle');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to delete vehicle:', error);
            throw error.response?.data || error;
        }
    },

};

export default UserService;