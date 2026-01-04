import API from "@/src/apis/axios";

const OrganizationService = {
    // Organization CRUD
    createOrganization: async (payload) => {
        try {
            const response = await API.post("/v1/organizations", payload);
            if (response.status !== 201) {
                throw new Error(response.data?.message || 'Failed to create organization');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to create organization:', error);
            throw error.response?.data || error;
        }
    },
    getAllOrganizations: async () => {
        try {
            debugger
            const response = await API.get("/v1/organizations");
            if (response.status !== 200) {
                throw new Error('Failed to fetch organizations');
            }
            return response.data;
        } catch (error) {
            debugger
            console.error('Failed to fetch organizations:', error);
            throw error.response?.data || error;
        }
    },
    getOrganizationById: async (orgId) => {
        try {
            const response = await API.get(`/v1/organizations/${orgId}`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch organization details');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch organization details:', error);
            throw error.response?.data || error;
        }
    },
    updateOrganization: async (orgId, payload) => {
        try {
            const response = await API.put(`/v1/organizations/${orgId}`, payload);
            if (response.status !== 200) {
                throw new Error('Failed to update organization');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update organization:', error);
            throw error.response?.data || error;
        }
    },

    // Member Management
    addMember: async (orgId, payload) => {
        try {
            debugger
            const response = await API.post(`/v1/organizations/${orgId}/members`, payload);
            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Failed to add member');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to add member:', error);
            throw error.response?.data || error;
        }
    },
    getMembers: async (orgId) => {
        try {
            const response = await API.get(`/v1/organizations/${orgId}/members`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch members');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch members:', error);
            throw error.response?.data || error;
        }
    },
    updateMemberRole: async (orgId, memberId, payload) => {
        try {
            const response = await API.put(`/v1/organizations/${orgId}/members/${memberId}`, payload);
            if (response.status !== 200) {
                throw new Error('Failed to update member role');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update member role:', error);
            throw error.response?.data || error;
        }
    },

    // Rides within Org
    getOrganizationRides: async (orgId) => {
        try {
            const response = await API.get(`/v1/organizations/${orgId}/rides`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch organization rides');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch organization rides:', error);
            throw error.response?.data || error;
        }
    },

    // Dashboard API for mobile
    getDashboard: async () => {
        try {
            const response = await API.get('/v1/dashboard/mobile');
            if (response.status !== 200) {
                throw new Error('Failed to fetch dashboard');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
            throw error.response?.data || error;
        }
    }
};

export default OrganizationService;
