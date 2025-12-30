import { Platform } from 'react-native';

// Mock object for Expo Go
const MockGoogleSignin = {
    configure: (config) => {
        console.log('[MockGoogleSignin] Configured with:', config);
    },
    hasPlayServices: async () => {
        console.log('[MockGoogleSignin] Checking Play Services');
        return true;
    },
    signIn: async () => {
        console.log('[MockGoogleSignin] Mocking Sign In');
        // Return a mock user object structure expected by the app
        return {
            idToken: 'mock-id-token-for-development',
            user: {
                id: 'mock-user-id',
                name: 'Expo Go Developer',
                email: 'dev@wayfind.app',
                photo: 'https://via.placeholder.com/150',
                familyName: 'Developer',
                givenName: 'Expo Go'
            }
        };
    },
    signOut: async () => {
        console.log('[MockGoogleSignin] Signed out');
    },
    isSignedIn: async () => Promise.resolve(false),
};

const MockStatusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

// Try to require the native module, fallback to mock if it fails
let GoogleSignin;
let statusCodes;

try {
    // Check for Expo Go specific constant if available, or just rely on the require failure
    // In managed Expo Go, this package is installed in node_modules but native part is missing.
    // The import might succeed but usage fails, OR import fails.
    // We can try to require it.
    const RNGoogleSignin = require('@react-native-google-signin/google-signin');
    GoogleSignin = RNGoogleSignin.GoogleSignin;
    statusCodes = RNGoogleSignin.statusCodes;

    // Extra safety: Check if native module is actually linked
    // Usually the library throws "Invariant Violation" on import if not linked, 
    // so safe require might be tricky if metro resolves it but runtime fails.
    // But we can catch the error here.
} catch (error) {
    console.warn('Google Sign-In native module not found (running in Expo Go?). Using Mock.');
    GoogleSignin = MockGoogleSignin;
    statusCodes = MockStatusCodes;
}

export { GoogleSignin, statusCodes };
