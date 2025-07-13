import API from "@/src/apis/axios";
import { getAccessToken } from "@/src/utils/token";

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
    try {
        const token = await getAccessToken();
        
        console.log("isAuthenticated here", token)
        // If no token exists, user is not authenticated
        if (!token) {
            return false;
        }
        
        console.log("Requesting for new token from backend...")
        // Validate token with backend
        const response = await API.get("/v1/auth/verify");
        return response.status === 200;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
}

// Export as default object for consistency
const AuthService = {
    requestOTP,
    isAuthenticated
};

export default AuthService;
