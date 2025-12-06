import { useState, useEffect } from 'react';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

export const useCameraPermissions = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await Camera.requestCameraPermission();
        setHasPermission(permission === 'granted');
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, []);

  return {
    hasPermission,
    isLoading,
    device,
  };
};
