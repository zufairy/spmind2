import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useAvatarStore, InteractionType } from '../stores/avatarStore';

// Optional sensor imports with fallback
let Accelerometer: any = null;
let Gyroscope: any = null;

try {
  const sensors = require('react-native-sensors');
  Accelerometer = sensors.Accelerometer;
  Gyroscope = sensors.Gyroscope;
} catch (error) {
  console.log('Sensors not available, using fallback interactions');
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AvatarInteractionHandlerProps {
  children: React.ReactNode;
  enableSensors?: boolean;
  enableTimeBased?: boolean;
  enableBatteryMonitoring?: boolean;
}

export default function AvatarInteractionHandler({
  children,
  enableSensors = true,
  enableTimeBased = true,
  enableBatteryMonitoring = true,
}: AvatarInteractionHandlerProps) {
  const { handleInteraction, updateContext } = useAvatarStore();
  const [sensorsAvailable, setSensorsAvailable] = useState(false);
  const lastShakeTime = useRef(0);
  const lastTiltTime = useRef(0);
  const shakeThreshold = 2.5;
  const tiltThreshold = 0.8;

  // Check if sensors are available
  useEffect(() => {
    if (Accelerometer && Gyroscope) {
      setSensorsAvailable(true);
    } else {
      setSensorsAvailable(false);
      console.log('Sensors not available, using alternative interactions');
    }
  }, []);

  // Accelerometer for shake detection
  useEffect(() => {
    if (!enableSensors || !sensorsAvailable || !Accelerometer) return;

    try {
      const accelerometer = new Accelerometer({
        updateInterval: 100,
      });

      const subscription = accelerometer.subscribe(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();

        // Shake detection
        if (acceleration > shakeThreshold && now - lastShakeTime.current > 1000) {
          lastShakeTime.current = now;
          handleInteraction('shake');
        }

        // Tilt detection
        if (Math.abs(x) > tiltThreshold && now - lastTiltTime.current > 2000) {
          lastTiltTime.current = now;
          handleInteraction('tilt');
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.log('Accelerometer not available:', error);
    }
  }, [enableSensors, sensorsAvailable, handleInteraction]);

  // Gyroscope for more precise tilt detection
  useEffect(() => {
    if (!enableSensors || !sensorsAvailable || !Gyroscope) return;

    try {
      const gyroscope = new Gyroscope({
        updateInterval: 100,
      });

      const subscription = gyroscope.subscribe(({ x, y, z }) => {
        const rotation = Math.sqrt(x * x + y * y + z * z);
        
        if (rotation > 0.5) {
          handleInteraction('tilt');
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.log('Gyroscope not available:', error);
    }
  }, [enableSensors, sensorsAvailable, handleInteraction]);

  // Time-based interactions
  useEffect(() => {
    if (!enableTimeBased) return;

    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';

      if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'afternoon';
      } else if (hour >= 17 && hour < 22) {
        timeOfDay = 'evening';
      } else {
        timeOfDay = 'night';
      }

      updateContext({ timeOfDay });

      // Trigger time-based interaction
      if (hour === 8 || hour === 20) {
        handleInteraction('time-based');
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [enableTimeBased, updateContext, handleInteraction]);

  // Battery monitoring
  useEffect(() => {
    if (!enableBatteryMonitoring) return;

    const checkBattery = async () => {
      try {
        // Note: This would require a battery monitoring library
        // For now, we'll simulate battery monitoring
        const batteryLevel = 0.8; // This would come from actual battery API
        
        updateContext({ batteryLevel });

        if (batteryLevel < 0.2) {
          handleInteraction('battery-low');
        }
      } catch (error) {
        console.log('Battery monitoring not available');
      }
    };

    checkBattery();
    const interval = setInterval(checkBattery, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enableBatteryMonitoring, updateContext, handleInteraction]);

  // App usage pattern detection
  useEffect(() => {
    const detectAppUsage = () => {
      // This would integrate with your app's navigation state
      // For now, we'll simulate different usage patterns
      const usagePatterns = ['learning', 'playing', 'reading', 'idle'] as const;
      const randomPattern = usagePatterns[Math.floor(Math.random() * usagePatterns.length)];
      
      updateContext({ appUsagePattern: randomPattern });
      handleInteraction('app-usage');
    };

    const interval = setInterval(detectAppUsage, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [updateContext, handleInteraction]);

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
