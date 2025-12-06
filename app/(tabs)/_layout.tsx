import { Tabs } from 'expo-router';
import { StyleSheet, View, Image } from 'react-native';
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeContainer]}>
              <Image 
                source={require('../../assets/images/menu/search.png')}
                style={[styles.tabIcon, focused && styles.activeIcon]}
                resizeMode="contain"
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeContainer]}>
              <Image 
                source={require('../../assets/images/menu/notes (1).png')}
                style={[styles.tabIcon, focused && styles.activeIcon]}
                resizeMode="contain"
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeContainer]}>
              <Image 
                source={require('../../assets/images/menu/home (1).png')}
                style={[styles.tabIcon, focused && styles.activeIcon]}
                resizeMode="contain"
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeContainer]}>
              <Image 
                source={require('../../assets/images/menu/game (2).png')}
                style={[styles.tabIcon, focused && styles.activeIcon]}
                resizeMode="contain"
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeContainer]}>
              <Image 
                source={require('../../assets/images/menu/tiger.png')}
                style={[styles.tabIcon, focused && styles.activeIcon]}
                resizeMode="contain"
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
    width: 48,
    height: 48,
    borderRadius: 12,
    padding: 8,
  },
  activeContainer: {
    backgroundColor: '#FFF4E6',
    borderWidth: 2,
    borderColor: '#FF9500',
    borderRadius: 12,
  },
  tabIcon: {
    width: 32,
    height: 32,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
  },
});