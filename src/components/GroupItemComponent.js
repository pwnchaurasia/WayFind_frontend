import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { theme } from '@/src/styles/theme';
import imagePath from '@/src/constants/imagePath';
import {generateSafeHexColor} from '@/src/utils/helpers'

const GroupItemComponent = ({item}) => {
  const size = 50;
  const backgroundColor = generateSafeHexColor()
  const textColor = theme.colors.text;
  const firstName = item?.name?.split(' ')[0] || 'User';
  const lastName = item?.name?.split(' ')[1] || 'Group';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();



    return (
      <>
      <TouchableOpacity onPress={() => handleGroupPress(item.id)}>
        <View style={styles.container} key={item.id}>
          <View style={styles.usersContainer}>
            <View style={[styles.nameCircle, { width: size, height: size, borderRadius:'50%', backgroundColor }]}>
              <Text style={[styles.text, { fontSize: 18, color: textColor }]}>{initials}</Text>
            </View>
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
      </TouchableOpacity>

      </>
    );
}

export default GroupItemComponent


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 0.3,
    borderBottomColor: theme.colors.border_color,
  },
  usersContainer: {
    flexDirection: 'row',
    marginRight: 20,
  },
  nameCircle:{
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  membersText: {
    fontSize: 14,
    color: theme.colors.muated_text,
  },
  notificationIndicator: {
    marginLeft: 8,
  },
  notificationBadge: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.colors.notification_dot,
  },
});