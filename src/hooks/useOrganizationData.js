import { useState, useEffect } from 'react';
import OrganizationService from '@/src/apis/organizationService';

export const useOrganizationData = (orgId) => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    fetchOrganizationData();
  }, [orgId]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);

      const response = await OrganizationService.getOrganizationById(orgId);
      console.log('Organization API response:', response);

      // Check for successful API response
      if (!response || response.status !== 'success' || !response.organization) {
        const errorMsg = response?.message || 'Organization data not found';
        console.error('Organization fetch failed:', errorMsg, response);
        throw new Error(errorMsg);
      }
      setOrganization(response.organization);
      setError(null);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message || 'Failed to load organization');
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };


  const refreshOrganization = () => {
    fetchOrganizationData();
  };

  return { organization, loading, error, refreshOrganization };
};
