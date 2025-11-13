import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key, value) => {
  try {
    // FIX: Validate value before storing
    if (value === null || value === undefined) {
      console.error(`Cannot store ${key}: value is null or undefined`);
      throw new Error(`Cannot store ${key}: value is null or undefined`);
    }
    
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
    console.log(` Successfully stored ${key}`);
  } catch (error) {
    console.error('Error storing data:', error);
    throw error; // Re-throw so caller knows it failed
  }
};

export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(` Successfully removed ${key}`);
  } catch (error) {
    console.error('Error removing data:', error);
  }
};
