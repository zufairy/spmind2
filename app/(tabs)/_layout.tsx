import { Tabs } from 'expo-router';
import { Search, FileText, Gamepad2, User, Home } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { isDark } = useTheme();

  const dynamicStyles = {
    tabBar: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      elevation: 8,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -2 },
      height: 80,
      paddingBottom: 20,
      paddingTop: 12,
      paddingHorizontal: 16,
      marginHorizontal: 0,
      marginBottom: 0,
      borderRadius: 0,
      justifyContent: 'space-between',
    },
  };

  return (
    <ProtectedRoute>
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, dynamicStyles.tabBar],
          tabBarActiveTintColor: '#22C55E',
          tabBarInactiveTintColor: '#6B7280',
          tabBarShowLabel: false,
          animation: 'fade',
          animationDuration: 300,
          lazy: true,
        }}
      >
      <Tabs.Screen
        name="search"
        options={{
          title: 'Solver',
          animation: 'fade',
          animationDuration: 300,
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.iconWrapper}>
              <Search 
                size={28} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
                style={focused ? styles.iconGlow : undefined}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          animation: 'fade',
          animationDuration: 300,
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.iconWrapper}>
              <FileText 
                size={28} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
                style={focused ? styles.iconGlow : undefined}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          animation: 'fade',
          animationDuration: 300,
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.iconWrapper}>
              <Home 
                size={28} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
                style={focused ? styles.iconGlow : undefined}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          animation: 'fade',
          animationDuration: 300,
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.iconWrapper}>
              <Gamepad2 
                size={28} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
                style={focused ? styles.iconGlow : undefined}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          animation: 'fade',
          animationDuration: 300,
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.iconWrapper}>
              <User 
                size={28} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
                style={focused ? styles.iconGlow : undefined}
              />
            </View>
          ),
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="lepak"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }, // Hide tab bar when in lepak
        }}
      />
      </Tabs>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 70,
    paddingBottom: 15,
    paddingTop: 15,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  iconGlow: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});