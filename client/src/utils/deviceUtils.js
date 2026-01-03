// client/src/utils/deviceUtils.js
import { v4 as uuidv4 } from 'uuid'; // You might need: npm install uuid

export const getDeviceId = () => {
  // 1. Check if this phone already has an ID
  let deviceId = localStorage.getItem('secure_device_id');
  
  // 2. If not, generate a new unique fingerprint
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem('secure_device_id', deviceId);
  }
  
  return deviceId;
};