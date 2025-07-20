import API from "@/src/apis/axios";


const UserService = {
    updateCurrentUserProfile: async (payload) => {
        console.log("payload in updateCurrentUserProfile", payload);
        return await API.put("/v1/users/me", payload)
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.log("error in updateCurrentUserProfile", error);
                throw error.response?.data || error;
            });
    },
    getCurrentUserProfile: async () => {
        console.log("payload in getCurrentUserProfile");
        try {
            const response = await API.get("/v1/users/me");
            return response;
        } catch (error) {
            console.error('Failed to get user profile:', error);
            throw error.response?.data || error;
        }
    },
    getCurrentUserGroups: async () => {
        try {
            const response = await API.get("/v1/users/groups");
            return response;
            
        } catch (error) {
            console.error('Failed to get user groups:', error);
            throw error.response?.data || error;
            
        }

    }

};

export default UserService;