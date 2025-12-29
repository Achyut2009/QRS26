import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getApiUrl = (path: string) => {
  if (Platform.OS === 'web') {
    return path;
  }
  
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri}${path}`;
  }
  
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:8081${path}`;
  }
  
  return `http://localhost:8081${path}`;
};
