import API from "@/src/apis/axios";
import { getAccessToken } from "@/src/utils/token";

export const googleLogin = async (idToken) => {
    return await API.post("/v1/auth/google", { token: idToken })
        .then((response) => response)
        .catch((error) => {
            console.error("Google Login Error:", error);
            throw error.response?.data || error;
        });
}

export const requestOTP = async (payload) => {
    console.log("payload in requestOTP", payload);
    return await API.post("/v1/auth/request-otp", payload)
        .then((response) => {
            return response;
        })
        .catch((error) => {
            console.log("error in requestOTP", error);
            throw error.response?.data || error;
        });
}

export const verifyOTP = async (payload) => {
    console.log("payload in verifyOTP", payload);
    return await API.post("/v1/auth/verify-otp", payload)
        .then((response) => {
            return response;
        })
        .catch((error) => {
            console.log("error in verifyOTP", error);
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
        const response = await API.post("/v1/auth/verify");
        return response.status === 200;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
}

// Export as default object for consistency
const AuthService = {
    requestOTP,
    verifyOTP,
    isAuthenticated,
    googleLogin
};

export default AuthService;
