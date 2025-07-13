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
    }

};

export default UserService;