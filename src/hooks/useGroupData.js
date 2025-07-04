import { useState, useEffect } from 'react';

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
      const response = await fetch(`https://your-api.com/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${your_auth_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch group data');
      }
      
      const groupData = await response.json();
      setGroup(groupData);
      setError(null);
    } catch (err) {
      console.error('Error fetching group:', err);
      setError(err.message);
      
      // Fallback data for development
      setGroup({
        id: groupId,
        name: 'Duxica Group',
        memberCount: 22,
        onlineCount: 12,
        image: null,
        members: [
          { id: '1', name: 'Mahdi Fadaee', phone: '+1234567890', image: null, isOnline: true },
          { id: '2', name: 'Arman', phone: '+1234567891', image: null, isOnline: false },
          { id: '3', name: 'Hooman Abasi', phone: '+1234567892', image: null, isOnline: true },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshGroup = () => {
    fetchGroupData();
  };

  return { group, loading, error, refreshGroup };
};