import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Dimensions, Platform } from 'react-native';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import UserService from '../apis/userService';

export const getDeviceInfo = async () => {
  try {
    const { width, height } = Dimensions.get('window');
    
    const calender = Localization.getCalendars()
    const locale = Localization.getLocales()
    
    const deviceInfo = {
      device_id: await getUniqueDeviceId(),
      device_model: Device.modelName || 'Unknown',
      device_brand: Device.brand || 'Unknown',
      os_name: Platform.OS,
      os_version: Device.osVersion || 'Unknown',
      app_version: Application.nativeApplicationVersion || '1.0.0',
      screen_width: width,
      screen_height: height,
      timezone: calender[0].timeZone || 'Unknown',
      locale: locale[0].languageTag || 'en-US'
    };

    console.log('Device Info collected:', deviceInfo);
    return deviceInfo;
  } catch (error) {
    console.error('Error getting device info:', error);
    return null;
  }
};

const generateFallbackDeviceId = () => {
  // Simple fallback device ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `device_${timestamp}_${random}`;
};

const generateDeviceId = async () => {
  try {
    // Use available device information to create a consistent ID
    const deviceModel = Device.modelName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    const brand = Device.brand || 'unknown';
    const platform = Platform.OS;
    
    // Create a semi-unique ID based on device characteristics
    const deviceString = `${platform}_${brand}_${deviceModel}_${osVersion}`;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    return `${deviceString}_${timestamp}_${random}`;
  } catch (error) {
    console.error('Error generating device ID:', error);
    return generateFallbackDeviceId();
  }
};



const getUniqueDeviceId = async () => {
  try {
    // Try to get device ID from different sources
    let deviceId = await SecureStore.getItemAsync('device_id');

    if (deviceId) {
      return deviceId;
    }

    deviceId = await generateDeviceId();
    await SecureStore.setItemAsync('device_id', deviceId);

    return deviceId;
  } catch (error) {
    console.error('Error getting unique device ID:', error);
    return generateFallbackDeviceId();
  }
};

export const updateDeviceLastActive = async () => {
  try {
    const response = await UserService.updateDeviceLastActive();
    return response.data;
  } catch (error) {
    console.error('Error updating device last active:', error);
    return false;
  }
};

// Clear stored device ID (useful for testing or user logout)
export const clearDeviceId = async () => {
  try {
    await AsyncStorage.removeItem('device_id');
    console.log('Device ID cleared');
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
};

export const sendDeviceInfo = async (deviceInfo) => {
  try {
    if (!deviceInfo) {
      console.error('No device info to send');
      return false;
    }

    const response = await UserService.updateUsersDeviceInfo(deviceInfo);
    console.log('Device info sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending device info:', error);
    return false;
  }
};


// Get device info with additional runtime data
export const getExtendedDeviceInfo = async () => {
  try {
    const basicInfo = await getDeviceInfo();
    
    const extendedInfo = {
      ...basicInfo,
      device_type: Device.deviceType ? Device.deviceType.toString() : 'Unknown',
      device_year_class: Device.deviceYearClass || null,
      total_memory: Device.totalMemory || null,
      is_tablet: Device.deviceType === Device.DeviceType.TABLET,
      is_phone: Device.deviceType === Device.DeviceType.PHONE,
      supports_64_bit: Platform.OS === 'ios' ? true : null, // iOS is always 64-bit
      platform_version: Platform.Version,
    };

    return extendedInfo;
  } catch (error) {
    console.error('Error getting extended device info:', error);
    return await getDeviceInfo(); // Fallback to basic info
  }
};