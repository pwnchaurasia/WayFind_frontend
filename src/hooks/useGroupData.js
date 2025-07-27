import { useState, useEffect } from 'react';
import GroupService from '@/src/apis/groupService'; // Adjust the import path as necessary

export const useGroupData = (groupId) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      
      // Replace with your actual API endpoint
      const response = await GroupService.getGroupById(groupId)
      if (!response || !response.group) {
        throw new Error('Group data not found');
      }
      const groupData = response?.group; 
      setGroup(groupData);
      setError(null);
    } catch (err) {
      console.error('Error fetching group:', err);
      setError(err.message);
      
      setGroup([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshGroup = () => {
    fetchGroupData();
  };

  return { group, loading, error, refreshGroup };
};
