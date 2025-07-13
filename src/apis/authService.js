import API from "@/src/apis/axios";

export const requestOTP = async (payload) => {
    return await API.post("/v1/auth/request-otp", payload)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            throw error.response?.data || error;
        });
}

export const isAuthenticated = async () => {
    return true
}
