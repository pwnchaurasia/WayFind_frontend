import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import VoiceRecorder from '@/src/components/groups/VoiceRecorder';
import { useGroupData } from '@/src/hooks/useGroupData';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { id } = useGlobalSearchParams();
  const { group } = useGroupData(id);
  const router = useRouter();

  const handleSendAudio = (audioUri, duration) => {
    console.log('Sending audio message:', audioUri, duration);
    // Handle audio sending logic here
    // You can add your audio message sending logic here
    // For example, you might want to add it to your messages state
  };

  return (
    <>
      {/* Voice Recorder Component - positioned above the tab bar */}
      {group && (
        <VoiceRecorder 
          group={group}
          onSendAudio={handleSendAudio}
        />
      )}
      
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Skip rendering the voice-recorder tab as a regular tab
          if (route.name === 'voice-recorder') {
            return null; // Don't render as a tab item since we'll show the VoiceRecorder component separately
          }

          const color = isFocused ? '#00C853' : '#666';
          
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabIcon}
            >
              {options.tabBarIcon({ color, size: 24, focused: isFocused })}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};

export default function GroupLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="[id]/index"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "chatbubble" : "chatbubble-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="[id]/members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "people" : "people-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="voice-recorder"
        options={{
          title: 'Voice',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.micButton}>
              <Ionicons name="mic" size={28} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="[id]/map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "map" : "map-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="[id]/settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
    borderTopWidth: 1,
    height: 90,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    flex: 1,
  },
  micButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  micButton: {
    backgroundColor: '#FF4444', // Red background for mic button
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10, // Slightly elevated
    shadowColor: '#FF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
