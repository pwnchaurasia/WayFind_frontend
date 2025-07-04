import React from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  TextInput,
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  FlatList,
  Image
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import GroupItemComponent from '@/src/components/GroupItemComponent';
import imagePath from '@/src/constants/imagePath';
import { theme } from '@/src/styles/theme';
import GroupListScreen from '../../screens/groups/GroupListScreen';

const { width, height } = Dimensions.get('window');

const GroupPageListScreen = () => {

    const groups = [
        {
          id: '1',
          name: 'Duxica Group',
          members: 21,
          hasNotification: true,
          group_image: imagePath.group_image,
          users: [
            imagePath.members_avatar,
            imagePath.members_avatar,
            imagePath.members_avatar,
          ]
        },
        {
          id: '2',
          name: 'Probo Team',
          members: 29,
          hasNotification: false,
          group_image: imagePath.group_image,
          users: [
            imagePath.members_avatar,
            imagePath.members_avatar,
            imagePath.members_avatar,
          ]
        },
        {
          id: '3',
          name: 'DOTX Team',
          members: 55,
          hasNotification: false,
          group_image: imagePath.group_image,
          users: [
            imagePath.members_avatar,
            imagePath.members_avatar,
            imagePath.members_avatar,
          ]
        },
      ];





  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GroupListScreen>
        
      </GroupListScreen>
      
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>WAYFIND</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View> */}
      
      {/* Search Bar */}
      {/* <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Groups"
          placeholderTextColor="#888"
        />
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
      </View> */}
      
      {/* Groups Header */}
      {/* <View style={styles.sectionHeader}>
        <View style={styles.hashtagContainer}>
          <Feather name="hash" size={18} color="#C8C8C8" />
        </View>
        <Text style={styles.sectionTitle}>GROUPS</Text>
      </View> */}
      
      {/* Groups List */}
      {/* <FlatList
        data={groups}
        renderItem={({ item }) => <GroupItemComponent item={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      /> */}
    </SafeAreaView>
  );
}

export default GroupPageListScreen

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: width * 0.02,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: height * 0.02,
      paddingHorizontal: width * 0.03,
      marginBottom: height * 0.02,
    },
    headerTitle: {
      color: 'white',
      fontSize: 26,
      fontWeight: 'bold',
    },
    menuButton: {
      padding: 5,
    },
    searchContainer: {
      backgroundColor: '#1E1E1E',
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      marginHorizontal: width * 0.03,
      marginBottom: height * 0.025,
      height: 46,
    },
    searchInput: {
      flex: 1,
      color: 'white',
      fontSize: 16,
      paddingVertical: 8,
    },
    searchIcon: {
      marginLeft: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: width * 0.03,
      marginBottom: height * 0.02,
    },
    hashtagContainer: {
      backgroundColor: '#2D2D2F',
      borderRadius: 8,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    sectionTitle: {
      color: '#C8C8C8',
      fontSize: 14,
      fontWeight: '600',
    },
    listContent: {
      paddingBottom: height * 0.1,
    },
    groupItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: width * 0.03,
    },
    groupLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarStack: {
      flexDirection: 'row',
      width: 60,
      height: 40,
      marginRight: 5,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      position: 'absolute',
      borderWidth: 1,
      borderColor: '#121212',
    },
    groupInfo: {
      marginLeft: 10,
    },
    groupName: {
      color: 'white',
      fontSize: 18,
      fontWeight: '500',
    },
    membersText: {
      color: '#888',
      fontSize: 14,
      marginTop: 2,
    },
    groupRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationButton: {
      backgroundColor: '#00C853',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    chevronButton: {
      backgroundColor: '#00C853',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    separator: {
      height: 1,
      backgroundColor: '#333',
      marginLeft: width * 0.15,
      marginRight: width * 0.03,
    },
  });