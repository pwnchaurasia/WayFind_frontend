import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const GroupItemComponent = ({item}) => {
    return (
      <>
      <View style={styles.container}>
        <View style={styles.usersContainer}>
          {item.users.map((user, index) => (
            <View key={index} style={styles.userAvatar}>
              {/* User avatar could be implemented with an Image component */}
              <Text style={styles.avatarText}>
                {user.initials || user.name?.charAt(0) || '?'}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.membersText}>{item.members} Members</Text>
        </View>
        
        {item.hasNotification && (
          <View style={styles.notificationIndicator}>
            <View style={styles.notificationBadge} />
          </View>
        )}
      </View>
      </>
    );
}

export default GroupItemComponent


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  usersContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8, // Overlapping effect
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  membersText: {
    fontSize: 14,
    color: '#666',
  },
  notificationIndicator: {
    marginLeft: 8,
  },
  notificationBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
});