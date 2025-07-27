import API from "@/src/apis/axios";


const GroupService = {
    createGroup: async (payload) => {
        try {
            const response = await API.post("/v1/groups", payload)    
            // If status is not 201, throw error
            if (response.status !== 201) {
                throw new Error(response.data?.message || 'Failed to create group');
            }
            return response.data; // Return just the data on success
        } catch (error) {
             // Handle different error cases
            if (error.response) {
                // Server responded with error status (400, 500, etc.)
                const errorData = error.response.data;
                throw new Error(errorData?.message || `Server error: ${error.response.status}`);
            } else {
                // Network error or other issues
                throw new Error('Network error. Please check your connection.');
            }
            
        }
        
    },
    joinGroupWithCode: async (payload) => {
        return await API.post("/v1/groups/join", payload)
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.log("error in joinGroupWithCode", error);
                throw error.response?.data || error;
            });
    },
    getGroupById: async (groupId) => {
        try {
            const response = await API.get(`/v1/groups/${groupId}/`)
            if (response.status !== 200) {
                throw new Error(response.data?.message || 'Failed to fetch group info');
            }
            return response.data; // Return just the data on success
            
        } catch (error) {
            if (error.response) {
                // Server responded with error status (400, 500, etc.)
                const errorData = error.response.data;
                throw new Error(errorData?.message || `Server error: ${error.response.status}`);
            } else {
                // Network error or other issues
                throw new Error('Network error. Please check your connection.');
            }
        }

    },
    getGroupUsers: async (groupId) => {
        
        try {
            const response = await API.get(`/v1/groups/${groupId}/users`)
            if (response.status !== 200) {
                throw new Error(response.data?.message || 'Failed to fetch group users');
            }
            
            return response.data; // Return just the data on success
            
        } catch (error) {
            if (error.response) {
                // Server responded with error status (400, 500, etc.)
                const errorData = error.response.data;
                throw new Error(errorData?.message || `Server error: ${error.response.status}`);
            } else {
                // Network error or other issues
                throw new Error('Network error. Please check your connection.');
            }
            
        }
    },
    refreshGroupJoinLink: async (groupId) => {
        console.log("groupId in refreshGroupJoinLink", groupId);
        return await API.post(`/v1/groups/${groupId}/refresh-join-link`)
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.log("error in refreshGroupJoinLink", error);
                throw error.response?.data || error;
            });
    }
}

export default GroupService;