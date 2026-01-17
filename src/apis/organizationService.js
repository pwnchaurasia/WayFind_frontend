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
            const response = await API.get("/v1/organizations");
            if (response.status !== 200) {
                throw new Error('Failed to fetch organizations');
            }
            return response.data;
        } catch (error) {
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
    getOrganizationRides: async (orgId, includeCompleted = false) => {
        try {
            const params = new URLSearchParams();
            if (includeCompleted) {
                params.append('include_completed', 'true');
            }
            const queryString = params.toString();
            const url = `/v1/organizations/${orgId}/rides${queryString ? `?${queryString}` : ''}`;
            const response = await API.get(url);
            if (response.status !== 200) {
                throw new Error('Failed to fetch organization rides');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch organization rides:', error);
            throw error.response?.data || error;
        }
    },

    // Get all people (org members + ride participants)
    getAllPeople: async (orgId) => {
        try {
            const response = await API.get(`/v1/organizations/${orgId}/all-people`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch all people');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to fetch all people:', error);
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
    },

    // Toggle member active status
    toggleMemberStatus: async (orgId, memberId) => {
        try {
            const response = await API.post(`/v1/organizations/${orgId}/members/${memberId}/toggle-status`);
            if (response.status !== 200) {
                throw new Error('Failed to toggle member status');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to toggle member status:', error);
            throw error.response?.data || error;
        }
    },

    // Remove member (soft delete)
    removeMember: async (orgId, memberId) => {
        try {
            const response = await API.delete(`/v1/organizations/${orgId}/members/${memberId}`);
            if (response.status !== 200) {
                throw new Error('Failed to remove member');
            }
            return response.data;
        } catch (error) {
            console.error('Failed to remove member:', error);
            throw error.response?.data || error;
        }
    },

    // ============================================
    // JOIN CODE / INVITE LINK METHODS
    // ============================================

    // Get join code for organization (admins only)
    getJoinCode: async (orgId) => {
        try {
            const response = await API.get(`/v1/organizations/${orgId}/join-code`);
            return response.data;
        } catch (error) {
            console.error('Failed to get join code:', error);
            throw error.response?.data || error;
        }
    },

    // Refresh/regenerate join code (admins only)
    refreshJoinCode: async (orgId) => {
        try {
            const response = await API.post(`/v1/organizations/${orgId}/join-code/refresh`);
            return response.data;
        } catch (error) {
            console.error('Failed to refresh join code:', error);
            throw error.response?.data || error;
        }
    },

    // Get organization info by join code (public - no auth required)
    getOrgByJoinCode: async (joinCode) => {
        try {
            const response = await API.get(`/v1/organizations/join/${joinCode}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get org by join code:', error);
            throw error.response?.data || error;
        }
    },

    // Join organization using join code (authenticated)
    joinOrganization: async (joinCode) => {
        try {
            const response = await API.post(`/v1/organizations/join/${joinCode}`);
            return response.data;
        } catch (error) {
            console.error('Failed to join organization:', error);
            throw error.response?.data || error;
        }
    }
};

export default OrganizationService;
