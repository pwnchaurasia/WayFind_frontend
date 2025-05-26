import React from 'react';
import { View, Text, FlatList, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';

const groups = [
  { id: '1', name: 'Duxica Group', members: 22 },
  { id: '2', name: 'Probo Team', members: 22 },
  { id: '3', name: 'DOTX Team', members: 22 },
];

const GroupListScreen = () => {
  const renderItem = ({ item }) => (
    <View style={styles.groupItem}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} style={styles.avatar} />
        <Image source={{ uri: 'https://randomuser.me/api/portraits/men/2.jpg' }} style={styles.avatar} />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.memberText}>{item.members} Members</Text>
      </View>
      <TouchableOpacity style={styles.rightButton}>
        <Text style={styles.rightArrow}>➡️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Group Page List</Text>
      <TextInput placeholder="Search Groups" style={styles.searchInput} placeholderTextColor="#888" />
      <Text style={styles.groupLabel}>GROUPS & CHANNELS</Text>
      <FlatList
        data={groups}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16 }}
      />
    </View>
  );
};

export default GroupListScreen;
