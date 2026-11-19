import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const getStorageItem = async (key) => {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
};

export const setStorageItem = async (key, value) => {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

export const removeStorageItem = async (key) => {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};