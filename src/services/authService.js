import API from "@/src/apis/axios";
import { getAccessToken, getRefreshToken, setToken, removeToken } from "@/src/utils/token";

/**
 * Authentication Service
 * 
 * This service handles all authentication-related operations:
 * - Token validation
 * - Token refresh
 * - OTP requests
 * - Logout functionality
 * 
 * It provides a clean interface for authentication operations
 * and handles token management automatically.
 */
class AuthenticationService {
  
  /**
   * Request OTP for phone number
   * @param {Object} payload - Contains phone number and other required data
   * @returns {Promise} API response
   */
  async requestOTP(payload) {
    try {
      const response = await API.post("/v1/auth/request-otp", payload);
      return response.data;
    } catch (error) {
      console.error('OTP request failed:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Verify OTP and get tokens
   * @param {Object} payload - Contains OTP and verification data
   * @returns {Promise} API response with tokens
   */
  async verifyOTP(payload) {
    try {
      const response = await API.post("/v1/auth/verify-otp", payload);
      
      // Store tokens if verification successful
      if (response.data.tokens) {
        await setToken(response.data.tokens);
      }
      
      return response.data;
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Check if user is authenticated
   * This method validates the current token and refreshes if needed
   * @returns {Promise<boolean>} Authentication status
   */
  async isAuthenticated() {
    try {
      const accessToken = await getAccessToken();
      
      // No token means not authenticated
      if (!accessToken) {
        console.log('No access token found');
        return false;
      }

      // Try to validate current token
      try {
        const response = await API.get("/v1/auth/verify");
        return response.status === 200;
      } catch (error) {
        // If token validation fails, try to refresh
        if (error.response?.status === 401) {
          console.log('Access token expired, attempting refresh...');
          return await this.refreshToken();
        }
        
        // Other errors mean not authenticated
        console.error('Token validation failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<boolean>} Success status
   */
  async refreshToken() {
    try {
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        console.log('No refresh token found');
        return false;
      }

      const response = await API.post("/v1/auth/refresh", {
        refresh_token: refreshToken
      });

      // Store new tokens
      if (response.data.tokens) {
        await setToken(response.data.tokens);
        console.log('Token refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens
      await removeToken();
      return false;
    }
  }

  /**
   * Logout user and clear tokens
   * @returns {Promise<boolean>} Success status
   */
  async logout() {
    try {
      // Try to notify backend about logout
      try {
        await API.post("/v1/auth/logout");
      } catch (error) {
        // Continue with local logout even if backend call fails
        console.warn('Backend logout failed, continuing with local logout:', error);
      }

      // Clear local tokens
      await removeToken();
      console.log('User logged out successfully');
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   * @returns {Promise} User data
   */
  async getCurrentUser() {
    try {
      const response = await API.get("/v1/auth/profile");
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error.response?.data || error;
    }
  }
}

// Export singleton instance
const AuthService = new AuthenticationService();
export default AuthService;
