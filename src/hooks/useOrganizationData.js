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

      const response = await OrganizationService.getOrganizationById(orgId)
      if (!response || !response.organization) {
        // response.organization based on expected API format
        throw new Error('Organization data not found');
      }
      setOrganization(response.organization);
      setError(null);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message);
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
