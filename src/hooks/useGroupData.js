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
      const your_auth_token = 'your_auth_token_here'; // Replace with your auth token
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
      
      // Fallback data for development - match your dummy groups
      const dummyGroups = {
        '1': {
          id: '1',
          name: 'Duxica Group',
          memberCount: 22,
          onlineCount: 12,
          image: null,
          members: [
            { id: '1', name: 'Mahdi Fadaee', phone: '+1234567890', image: null, isOnline: true },
            { id: '2', name: 'Arman', phone: '+1234567891', image: null, isOnline: false },
            { id: '3', name: 'Hooman Abasi', phone: '+1234567892', image: null, isOnline: true },
            { id: '4', name: 'Sarah Johnson', phone: '+1234567893', image: null, isOnline: true },
            { id: '5', name: 'Mike Chen', phone: '+1234567894', image: null, isOnline: false },
          ]
        },
        '2': {
          id: '2',
          name: 'Probo Team',
          memberCount: 22,
          onlineCount: 8,
          image: null,
          members: [
            { id: '6', name: 'Alex Rodriguez', phone: '+1234567895', image: null, isOnline: true },
            { id: '7', name: 'Emma Wilson', phone: '+1234567896', image: null, isOnline: true },
            { id: '8', name: 'David Kim', phone: '+1234567897', image: null, isOnline: false },
            { id: '9', name: 'Lisa Zhang', phone: '+1234567898', image: null, isOnline: true },
          ]
        },
        '3': {
          id: '3',
          name: 'DOTX Team',
          memberCount: 22,
          onlineCount: 15,
          image: null,
          members: [
            { id: '10', name: 'John Smith', phone: '+1234567899', image: null, isOnline: true },
            { id: '11', name: 'Maria Garcia', phone: '+1234567800', image: null, isOnline: true },
            { id: '12', name: 'Robert Brown', phone: '+1234567801', image: null, isOnline: false },
            { id: '13', name: 'Jennifer Davis', phone: '+1234567802', image: null, isOnline: true },
          ]
        }
      };

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
