import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, Dimensions, Image, Animated, TextInput, Linking, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { 
  Bell, 
  Settings, 
  Clock, 
  BookOpen, 
  Bookmark, 
  MessageSquare, 
  GraduationCap, 
  TrendingUp,
  ChevronRight,
  Award,
  Star,
  Sparkles,
  Trophy,
  Target,
  Zap,
  Crown,
  LogOut,
  User,
  Shield,
  Moon,
  Sun,
  HelpCircle,
  Info,
  X,
  Plus,
  Grid,
  Menu,
  Edit3,
  Activity,
  BarChart3,
  Check,
  Camera,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [username, setUsername] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const pageFadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '');
      setUsername((user as any).username || '');
      setProfileBio((user as any).bio || 'Ambitious');
      setAvatarUri((user as any).avatar_url || null);
      setSelectedAvatar(user.full_name?.charAt(0)?.toUpperCase() || 'S');
      setUserPoints((user as any).points || 0);
    }
  }, [user]);

  // Fetch points from database
  useEffect(() => {
    const fetchPoints = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('points')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setUserPoints(data.points || 0);
        }
      }
    };

    fetchPoints();
  }, [user?.id]);

  // Fetch achievements from database
  useEffect(() => {
    const fetchAchievements = async () => {
      if (user?.id) {
        setLoadingAchievements(true);
        try {
          const { data, error } = await supabase
            .rpc('get_user_achievements', { p_user_id: user.id });

          if (!error && data) {
            setAchievements(data);
          } else {
            console.error('Error fetching achievements:', error);
            setAchievements([]);
          }
        } catch (error) {
          console.error('Error fetching achievements:', error);
          setAchievements([]);
        } finally {
          setLoadingAchievements(false);
        }
      }
    };

    fetchAchievements();
  }, [user?.id]);

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user?.id) {
        setLoadingNotifications(true);
        try {
          const { data, error } = await supabase
            .rpc('get_user_notifications', { p_user_id: user.id, p_limit: 50 });

          if (!error && data) {
            setNotifications(data);
          } else {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
          setNotifications([]);
        } finally {
          setLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .rpc('get_unread_notification_count', { p_user_id: user.id });

          if (!error && data !== null) {
            setUnreadCount(data);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }
    };

    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Page fade-in animation on mount (faster for better UX)
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 150, // Reduced from 300ms for faster load
      useNativeDriver: true,
    }).start();
  }, []);

  // Level system based on points
  const getLevelInfo = (points: number) => {
    const levels = [
      { level: 1, name: 'Beginner', minPoints: 0, maxPoints: 100, color: '#9CA3AF' },
      { level: 2, name: 'Learner', minPoints: 100, maxPoints: 250, color: '#60A5FA' },
      { level: 3, name: 'Explorer', minPoints: 250, maxPoints: 500, color: '#34D399' },
      { level: 4, name: 'Ambitious', minPoints: 500, maxPoints: 1000, color: '#FBBF24' },
      { level: 5, name: 'Achiever', minPoints: 1000, maxPoints: 2000, color: '#F59E0B' },
      { level: 6, name: 'Scholar', minPoints: 2000, maxPoints: 3500, color: '#EC4899' },
      { level: 7, name: 'Expert', minPoints: 3500, maxPoints: 5000, color: '#8B5CF6' },
      { level: 8, name: 'Master', minPoints: 5000, maxPoints: 7500, color: '#EF4444' },
      { level: 9, name: 'Virtuoso', minPoints: 7500, maxPoints: 10000, color: '#F97316' },
      { level: 10, name: 'Legend', minPoints: 10000, maxPoints: Infinity, color: '#FFD700' },
    ];

    const currentLevel = levels.find(l => points >= l.minPoints && points < l.maxPoints) || levels[0];
    const nextLevel = levels[currentLevel.level] || currentLevel;
    
    const pointsInLevel = points - currentLevel.minPoints;
    const pointsNeeded = currentLevel.maxPoints - currentLevel.minPoints;
    const progress = currentLevel.maxPoints === Infinity 
      ? 100 
      : Math.min(100, (pointsInLevel / pointsNeeded) * 100);

    return {
      currentLevel: currentLevel.level,
      currentLevelName: currentLevel.name,
      nextLevelName: nextLevel.name,
      levelColor: currentLevel.color,
      progress,
      pointsToNext: currentLevel.maxPoints === Infinity ? 0 : currentLevel.maxPoints - points,
      maxPoints: currentLevel.maxPoints === Infinity ? points : currentLevel.maxPoints,
    };
  };

  const levelInfo = getLevelInfo(userPoints);

  const userStats = {
    points: userPoints,
    questionsAsked: 12,
    timeWithTutor: 3.5, // hours
    rank: `Level ${levelInfo.currentLevel} - ${levelInfo.currentLevelName}`,
    nextRank: levelInfo.currentLevel === 10 ? 'Max Level!' : `Level ${levelInfo.currentLevel + 1} - ${levelInfo.nextLevelName}`,
    progress: levelInfo.progress,
    pointsToNext: levelInfo.pointsToNext,
    maxPoints: levelInfo.maxPoints,
    levelColor: levelInfo.levelColor,
  };

  // Helper function to get subject-specific icons and colors
  const getSubjectConfig = (subject: string) => {
    const configs: { [key: string]: { icon: string; color: string; bgColor: string } } = {
      'Mathematics': { icon: '🔢', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.2)' },
      'Bahasa Melayu': { icon: '📖', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.2)' },
      'English': { icon: '🇬🇧', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.2)' },
      'Sejarah': { icon: '🏛️', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.2)' },
      'Science': { icon: '🔬', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.2)' },
    };
    return configs[subject] || { icon: '⭐', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.2)' };
  };

  const menuItems = [
    { icon: Activity, title: 'Brain Boost History', hasNotification: false },
    { icon: BookOpen, title: 'Textbooks', hasNotification: false },
    { icon: User, title: 'Edit profile', hasNotification: false },
    { icon: Crown, title: 'Subscriptions', hasNotification: false },
    { icon: Info, title: 'About Us', hasNotification: false },
  ];

  const rankCheckpoints = [
    { rank: 'Beginner', points: 0, icon: '🌱', color: '#4CAF50', unlocked: true },
    { rank: 'Explorer', points: 100, icon: '🔍', color: '#2196F3', unlocked: true },
    { rank: 'Ambitious', points: 250, icon: '🚀', color: '#FF9800', unlocked: true, current: true },
    { rank: 'Virtuoso', points: 500, icon: '🎯', color: '#9C27B0', unlocked: false },
    { rank: 'Master', points: 1000, icon: '👑', color: '#FFD700', unlocked: false },
    { rank: 'Legend', points: 2000, icon: '⭐', color: '#E91E63', unlocked: false },
  ];

  // Helper function to get notification icon component
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'level_up':
        return Trophy;
      case 'achievement':
        return Award;
      case 'streak':
        return Zap;
      default:
        return MessageSquare;
    }
  };

  // Helper function to get notification icon color
  const getNotificationIconColor = (type: string, iconColor?: string) => {
    if (iconColor) return iconColor;
    switch (type) {
      case 'level_up':
        return '#FFD700';
      case 'achievement':
        return '#FF8C00';
      case 'streak':
        return '#FF9800';
      default:
        return '#FF8C00';
    }
  };

  const avatarOptions = [
    { id: 1, emoji: '😊', color: '#FF6B6B' },
    { id: 2, emoji: '🚀', color: '#4ECDC4' },
    { id: 3, emoji: '🎯', color: '#45B7D1' },
    { id: 4, emoji: '⭐', color: '#FFD93D' },
    { id: 5, emoji: '🔥', color: '#FF9800' },
    { id: 6, emoji: '💡', color: '#9C27B0' },
    { id: 7, emoji: '🎨', color: '#E91E63' },
    { id: 8, emoji: '🎓', color: '#00BCD4' },
  ];

  const settingsMenuItems = [
    { icon: User, title: 'Edit Profile', action: () => handleEditProfile() },
    { icon: Shield, title: 'Privacy Settings', action: () => handlePrivacySettings() },
    { 
      icon: isDark ? Sun : Moon, 
      title: isDark ? 'Light Mode' : 'Dark Mode', 
      action: () => handleThemeToggle(), 
      toggle: true 
    },
    { icon: HelpCircle, title: 'Help & Support', action: () => handleHelpSupport() },
    { icon: Info, title: 'About TutorPal', action: () => handleAbout() },
    { icon: LogOut, title: 'Logout', action: () => handleLogout(), danger: true },
  ];

  const handleEditProfile = () => {
    setSettingsVisible(false);
    setEditProfileVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        setSelectedAvatar(''); // Clear emoji selection when image is picked
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      if (!user?.id) return null;

      setUploading(true);

      // Create a unique filename with user ID as folder
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to ArrayBuffer
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    try {
      setUploading(true);
      
      // Check if username has changed and if it's available
      const originalUsername = (user as any)?.username || '';
      if (username.trim() !== originalUsername) {
        const { data: exists, error: checkError } = await supabase
          .rpc('check_username_exists', { username_to_check: username.trim() });
        
        if (checkError) {
          console.error('Error checking username:', checkError);
        } else if (exists) {
          Alert.alert('Error', 'This username is already taken. Please choose a different one.');
          setUploading(false);
          return;
        }
      }
      
      let avatarUrl = (user as any)?.avatar_url || null;

      // Upload new image if one was selected
      if (avatarUri && !avatarUri.startsWith('http')) {
        const uploadedUrl = await uploadImage(avatarUri);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Update profile in database
      const updates: any = {
        full_name: profileName.trim(),
        username: username.trim(),
        bio: profileBio.trim() || 'Ambitious',
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user?.id || '');

      if (error) {
        console.error('Update error:', error);
        
        // Check for duplicate username error
        const errorMsg = error.message?.toLowerCase() || '';
        if (error.code === '23505' && errorMsg.includes('username')) {
          Alert.alert('Error', 'This username is already taken. Please choose a different one.');
          return;
        }
        
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      // Update local auth context
      await updateProfile(updates);
      
      Alert.alert('Success', 'Profile updated successfully!');
      setEditProfileVisible(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setUploading(false);
    }
  };

  const handlePrivacySettings = () => {
    setSettingsVisible(false);
    Alert.alert('Privacy Settings', 'Privacy settings functionality coming soon!');
  };

  const handleThemeToggle = async () => {
    try {
      await toggleTheme();
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const handleHelpSupport = () => {
    setSettingsVisible(false);
    Alert.alert('Help & Support', 'Help and support functionality coming soon!');
  };

  const handleAbout = () => {
    setSettingsVisible(false);
    Alert.alert('About TutorPal', 'TutorPal v1.0.0\nYour AI-powered learning companion');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setSettingsVisible(false);
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleTextbooksClick = async () => {
    // Google Drive folder link - Make sure this folder is shared publicly or with "Anyone with the link"
    const googleDriveUrl = 'https://drive.google.com/drive/folders/1Db3HZ4ScUiS24mckQhZVe4SnXkx8fbxw';
    
    try {
      const canOpen = await Linking.canOpenURL(googleDriveUrl);
      if (canOpen) {
        await Linking.openURL(googleDriveUrl);
      } else {
        Alert.alert(
          'Cannot Open Link', 
          'Unable to open the textbooks folder. Please make sure you have a browser installed.'
        );
      }
    } catch (error) {
      console.error('Error opening textbooks link:', error);
      Alert.alert(
        'Access Issue',
        'Unable to access the textbooks folder. Please ensure:\n\n1. The folder is shared publicly\n2. You have an internet connection\n3. Try again in a moment'
      );
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark notification as read
      await supabase.rpc('mark_notification_read', { p_notification_id: notification.id });
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Close dropdown
      setNotificationsVisible(false);
      
      // Show notification details
      Alert.alert(notification.title, notification.message);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotificationsVisible(false);
      Alert.alert(notification.title, notification.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (user?.id) {
        await supabase.rpc('mark_all_notifications_read', { p_user_id: user.id });
        
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handlePremiumSelect = (plan: string, price: string) => {
    setPremiumVisible(false);
    // Navigate to payment page
    router.push({
      pathname: '/payment',
      params: {
        plan: plan,
        price: price,
        planType: plan === '1 Subject' ? 'basic' : 'premium'
      }
    });
  };

  const handleMenuClick = (item: any) => {
    switch (item.title) {
      case 'Edit profile':
        setEditProfileVisible(true);
        break;
      case 'Subscriptions':
        router.push('/subscriptions');
        break;
      case 'About Us':
        Alert.alert('About Us', 'SPMind - Your AI-powered learning companion\n\nVersion 1.0.0\n\n© 2024 SPMind. All rights reserved.');
        break;
      case 'Brain Boost History':
        // Navigate to brain boost history
        router.push('/brain-boost-history');
        break;
      case 'Textbooks':
        handleTextbooksClick();
        break;
      default:
        break;
    }
  };

  // Dynamic styles based on theme - Duolingo style (clean white cards)
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#F5F5F5',
    },
    headerTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    headerButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
    },
    avatar: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8',
    },
    avatarText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    editAvatarButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
    },
    username: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    userHandleInline: {
      color: isDark ? '#999999' : '#666666',
    },
    userRank: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    userSchool: {
      color: isDark ? '#AAAAAA' : '#666666',
    },
    userGrade: {
      color: isDark ? '#AAAAAA' : '#666666',
    },
    statusText: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    statCard: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
    },
    statNumber: {
      color: '#000000',
    },
    statLabel: {
      color: '#666666',
    },
    premiumCard: {
      backgroundColor: '#FFFFFF',
    },
    premiumTitle: {
      color: '#000000',
    },
    premiumSubtitle: {
      color: '#666666',
    },
    sectionTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    menuItem: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
    },
    menuTitle: {
      color: '#000000',
    },
    menuIcon: {
      backgroundColor: '#F0F0F0',
    },
    rankingCard: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
    },
    currentRank: {
      color: '#000000',
    },
    rankDescription: {
      color: '#666666',
    },
    progressText: {
      color: '#000000',
    },
    progressTrack: {
      backgroundColor: '#E8E8E8',
    },
    nextRankText: {
      color: '#666666',
    },
    achievementCard: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
    },
    achievementTitle: {
      color: '#000000',
    },
    settingsModal: {
      backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
    },
    modalTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    modalHeader: {
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
    },
    settingsItem: {
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E0E0E0',
    },
    settingsTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    settingsIcon: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0',
    },
    toggleSwitch: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E0E0E0',
    },
    notificationDropdown: {
      backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
    },
    notificationHeader: {
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
    },
    notificationTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    notificationItem: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FAFAFA',
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E0E0E0',
    },
    notificationItemTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    notificationMessage: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    notificationTime: {
      color: isDark ? '#999999' : '#999999',
    },
    editInput: {
      backgroundColor: '#FFFFFF',
      color: '#000000',
      borderColor: '#E0E0E0',
    },
  };

  return (
    <Animated.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Duolingo Style Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={[styles.headerButton, dynamicStyles.headerButton]}
                  onPress={() => setNotificationsVisible(!notificationsVisible)}
                >
                  <Bell size={20} color="#FF8C00" />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationText}>{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.headerButton, dynamicStyles.headerButton]}
                  onPress={() => setSettingsVisible(true)}
                >
                  <Settings size={20} color="#FF8C00" />
                </TouchableOpacity>
              </View>
            </View>

            {/* User Profile Section - Horizontal Layout */}
            <Animatable.View animation="fadeInUp" delay={200} style={styles.profileSection}>
              <View style={styles.profileHorizontalContainer}>
                {/* Profile Picture on the Left */}
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatar, dynamicStyles.avatar]}>
                    {avatarUri ? (
                      <Image 
                        source={{ uri: avatarUri }} 
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {selectedAvatar}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[styles.editAvatarButton, dynamicStyles.editAvatarButton]}
                    onPress={() => setEditProfileVisible(true)}
                  >
                    <Edit3 size={16} color="#FF8C00" />
                  </TouchableOpacity>
                </View>
                
                {/* User Info on the Right */}
                <View style={styles.userDetailsRight}>
                  <View style={styles.nameUsernameRow}>
                    <Text style={[styles.username, dynamicStyles.username]}>{profileName || 'Student'}</Text>
                    {username && (
                      <Text style={[styles.userHandleInline, dynamicStyles.userHandleInline]}>@{username}</Text>
                    )}
                  </View>
                  
                  <View style={styles.levelRow}>
                    <View style={[styles.levelBadgeSmall, { backgroundColor: '#FF8C00' }]}>
                      <Text style={styles.levelBadgeIcon}>⚔️</Text>
                    </View>
                    <Text style={[styles.userLevel, dynamicStyles.userRank]}>{levelInfo.currentLevelName}</Text>
                  </View>
                  
                  {(user as any)?.current_school && (
                    <Text style={[styles.userSchool, dynamicStyles.userSchool]}>
                      {(user as any).current_school}
                    </Text>
                  )}
                  {(user as any)?.age && (
                    <Text style={[styles.userGrade, dynamicStyles.userGrade]}>
                      Grade {(user as any).age >= 13 ? 'Form ' + Math.min((user as any).age - 12, 5) : (user as any).age - 6}
                    </Text>
                  )}
                </View>
              </View>
            </Animatable.View>
          </View>
        </View>

         {/* Modern Stats Cards */}
         <Animatable.View animation="fadeInUp" delay={300} style={styles.statsSection}>
           <View style={styles.statsContainer}>
             <View style={[styles.statCard, dynamicStyles.statCard]}>
               <View style={[styles.statIcon, { backgroundColor: '#FF8C00' }]}>
                 <Trophy size={20} color="#FFFFFF" />
               </View>
               <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{userStats.points}</Text>
               <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Points</Text>
             </View>
             <View style={[styles.statCard, dynamicStyles.statCard]}>
               <View style={[styles.statIcon, { backgroundColor: '#FF9800' }]}>
                 <HelpCircle size={20} color="#FFFFFF" />
               </View>
               <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{userStats.questionsAsked}</Text>
               <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Questions</Text>
             </View>
             <View style={[styles.statCard, dynamicStyles.statCard]}>
               <View style={[styles.statIcon, { backgroundColor: '#FF6B00' }]}>
                 <Clock size={20} color="#FFFFFF" />
               </View>
               <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{userStats.timeWithTutor}h</Text>
               <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Tutor Time</Text>
             </View>
           </View>
         </Animatable.View>

        {/* Premium Card - 3D Duolingo Style */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.premiumSection}>
          <TouchableOpacity 
            style={styles.premiumCard3D}
            onPress={() => setPremiumVisible(true)}
            activeOpacity={0.9}
          >
            <View style={styles.premiumCard3DShadow} />
            <LinearGradient
              colors={['#FF8C00', '#FF8C00', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCard3DContent}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumLeft}>
                  <View style={styles.premiumIconContainer3D}>
                    <Crown size={28} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.premiumTitle3D}>Upgrade to SPMind+</Text>
                    <Text style={styles.premiumSubtitle3D}>Unlock unlimited AI features</Text>
                  </View>
                </View>
                <View style={styles.premiumArrow3D}>
                  <ChevronRight size={24} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Menu Items */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.menuSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>My Account</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <Animatable.View key={item.title} animation="fadeInLeft" delay={700 + index * 100}>
                <TouchableOpacity 
                  style={[styles.menuItem, dynamicStyles.menuItem]}
                  onPress={() => handleMenuClick(item)}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, dynamicStyles.menuIcon]}>
                      <item.icon size={20} color="#FF8C00" />
                    </View>
                    <Text style={[styles.menuTitle, dynamicStyles.menuTitle]}>{item.title}</Text>
                  </View>
                  <ChevronRight size={20} color="#999999" />
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        </Animatable.View>

        {/* Ranking Section */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.rankingSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Your Journey</Text>
          <View style={[styles.rankingCard, dynamicStyles.rankingCard]}>
            <View style={styles.rankingHeader}>
              <View style={styles.rankingInfo}>
                <View style={styles.levelBadge}>
                  <LinearGradient
                    colors={[userStats.levelColor, userStats.levelColor + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.levelBadgeGradient}
                  >
                    <Text style={styles.levelNumber}>{levelInfo.currentLevel}</Text>
                  </LinearGradient>
                </View>
                <View>
                  <Text style={[styles.currentRank, dynamicStyles.currentRank]}>{levelInfo.currentLevelName}</Text>
                  <Text style={[styles.rankDescription, dynamicStyles.rankDescription]}>Current Level</Text>
                </View>
              </View>
              <View style={styles.rankingProgress}>
                <Text style={[styles.progressText, dynamicStyles.progressText]}>
                  {userStats.points}/{levelInfo.currentLevel === 10 ? '∞' : userStats.maxPoints}
                </Text>
                <View style={[styles.progressTrack, dynamicStyles.progressTrack]}>
                  <LinearGradient
                    colors={['#FF8C00', '#FF6B00']}
                    style={[styles.progressFill, { width: `${userStats.progress}%` }]}
                  />
                </View>
                <Text style={[styles.nextRankText, dynamicStyles.nextRankText]}>
                  {levelInfo.currentLevel === 10 
                    ? '🏆 Max Level Reached!' 
                    : `${userStats.pointsToNext} pts to ${userStats.nextRank}`}
                </Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Achievements Section */}
        <Animatable.View animation="fadeInUp" delay={900} style={styles.achievementsSection}>
          <View style={styles.achievementHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Achievements</Text>
            <Text style={[styles.achievementSubtitle, dynamicStyles.rankDescription]}>
              Complete 10 brain boosts per subject
            </Text>
          </View>
          
          {loadingAchievements ? (
            <View style={styles.achievementLoadingContainer}>
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
              {achievements.map((achievement, index) => {
                const subjectConfig = getSubjectConfig(achievement.subject);
                return (
                  <Animatable.View 
                    key={achievement.id} 
                    animation="bounceIn" 
                    delay={1000 + index * 100}
                    style={[
                      styles.achievementCard,
                      dynamicStyles.achievementCard,
                      achievement.earned && styles.achievementEarned
                    ]}
                  >
                      <View style={[
                        styles.achievementIcon,
                        { 
                          backgroundColor: achievement.earned ? subjectConfig.bgColor : '#F0F0F0',
                          borderWidth: achievement.earned ? 2 : 1,
                          borderColor: achievement.earned ? subjectConfig.color : '#E0E0E0'
                        }
                      ]}>
                      <Text style={styles.achievementEmoji}>
                        {achievement.earned ? subjectConfig.icon : '🔒'}
                      </Text>
                    </View>
                    <Text style={[styles.achievementTitle, dynamicStyles.achievementTitle]} numberOfLines={1}>
                      {achievement.subject?.split(' ')[0]}
                    </Text>
                    <View style={styles.achievementProgressContainer}>
                      <View style={[styles.achievementProgressBar, { backgroundColor: '#E8E8E8' }]}>
                        <View 
                          style={[
                            styles.achievementProgressFill,
                            { 
                              width: `${achievement.progress_percentage}%`,
                              backgroundColor: achievement.earned ? subjectConfig.color : '#FF8C00'
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.achievementProgressText, dynamicStyles.rankDescription]}>
                        {achievement.current_count}/{achievement.required_count}
                      </Text>
                    </View>
                  </Animatable.View>
                );
              })}
            </ScrollView>
          )}
        </Animatable.View>
      </ScrollView>

      {/* Notification Dropdown */}
      {notificationsVisible && (
        <TouchableOpacity 
          style={styles.notificationOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsVisible(false)}
        >
          <Animatable.View 
            animation="fadeInDown" 
            duration={300}
            style={[styles.notificationDropdown, dynamicStyles.notificationDropdown]}
          >
            <View style={[styles.notificationHeader, dynamicStyles.notificationHeader]}>
              <Text style={[styles.notificationTitle, dynamicStyles.notificationTitle]}>Notifications</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={handleMarkAllAsRead}>
                    <Text style={{ color: '#FF8C00', fontSize: 14, fontFamily: 'Inter-Medium' }}>
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                  <X size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
              {loadingNotifications ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#FF8C00" />
                </View>
              ) : notifications.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Bell size={48} color={isDark ? '#666666' : '#CCCCCC'} />
                  <Text style={[styles.emptyNotificationText, dynamicStyles.notificationMessage]}>
                    No notifications yet
                  </Text>
                </View>
              ) : (
                notifications.map((notification, index) => {
                  const NotificationIcon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationIconColor(notification.type, notification.icon_color);
                  
                  return (
                    <Animatable.View 
                      key={notification.id} 
                      animation="fadeInLeft" 
                      delay={index * 100}
                    >
                      <TouchableOpacity 
                        style={[
                          styles.notificationItem, 
                          dynamicStyles.notificationItem,
                          !notification.read && styles.notificationUnread
                        ]}
                        onPress={() => handleNotificationClick(notification)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.notificationIconContainer, { backgroundColor: `${iconColor}20` }]}>
                          <NotificationIcon size={18} color={iconColor} />
                        </View>
                        <View style={styles.notificationContent}>
                          <Text style={[styles.notificationItemTitle, dynamicStyles.notificationItemTitle]}>
                            {notification.title}
                          </Text>
                          <Text style={[styles.notificationMessage, dynamicStyles.notificationMessage]} numberOfLines={2}>
                            {notification.message}
                          </Text>
                          <Text style={[styles.notificationTime, dynamicStyles.notificationTime]}>
                            {notification.time_ago}
                          </Text>
                        </View>
                        {!notification.read && <View style={styles.unreadDot} />}
                      </TouchableOpacity>
                    </Animatable.View>
                  );
                })
              )}
            </ScrollView>
          </Animatable.View>
        </TouchableOpacity>
      )}

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editProfileModal, dynamicStyles.settingsModal]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Edit Profile</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setEditProfileVisible(false)}
              >
                <X size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.editProfileContent} showsVerticalScrollIndicator={false}>
              {/* Avatar Upload */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionTitle, dynamicStyles.modalTitle]}>Profile Picture</Text>
                
                {/* Current Avatar Preview */}
                <View style={styles.currentAvatarContainer}>
                  <View style={[styles.currentAvatar, dynamicStyles.avatar]}>
                    {avatarUri ? (
                      <Image 
                        source={{ uri: avatarUri }} 
                        style={styles.currentAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {selectedAvatar}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={pickImage}
                    disabled={uploading}
                  >
                    <Camera size={20} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Emoji Options */}
                <Text style={[styles.orText, dynamicStyles.userRank]}>Or choose an emoji</Text>
                <View style={styles.avatarGrid}>
                  {avatarOptions.map((avatar) => (
                    <TouchableOpacity
                      key={avatar.id}
                      style={[
                        styles.avatarOption,
                        { backgroundColor: `${avatar.color}20` },
                        selectedAvatar === avatar.emoji && !avatarUri && styles.avatarOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedAvatar(avatar.emoji);
                        setAvatarUri(null);
                      }}
                    >
                      <Text style={styles.avatarOptionEmoji}>{avatar.emoji}</Text>
                      {selectedAvatar === avatar.emoji && !avatarUri && (
                        <View style={[styles.avatarCheck, { backgroundColor: avatar.color }]}>
                          <Check size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionTitle, dynamicStyles.modalTitle]}>Name</Text>
                <TextInput
                  style={[styles.editInput, dynamicStyles.editInput]}
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Enter your name"
                  placeholderTextColor={isDark ? "#666666" : "#999999"}
                />
              </View>

              {/* Username Input */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionTitle, dynamicStyles.modalTitle]}>Username</Text>
                <View style={[styles.usernameInputContainer, dynamicStyles.editInput]}>
                  <Text style={[styles.usernamePrefix, dynamicStyles.modalTitle]}>@</Text>
                  <TextInput
                    style={[styles.usernameInput, dynamicStyles.editInput]}
                    value={username}
                    onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    placeholderTextColor={isDark ? "#666666" : "#999999"}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Bio Input */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionTitle, dynamicStyles.modalTitle]}>Bio</Text>
                <TextInput
                  style={[styles.editInput, styles.bioInput, dynamicStyles.editInput]}
                  value={profileBio}
                  onChangeText={setProfileBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={isDark ? "#666666" : "#999999"}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <LinearGradient
                  colors={['#FF8C00', '#FF9800', '#FF6B00']}
                  style={styles.saveButtonGradient}
                >
                  <Check size={20} color="#000000" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsModal, dynamicStyles.settingsModal]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Settings</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSettingsVisible(false)}
              >
                <X size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
              {settingsMenuItems.map((item, index) => (
                <Animatable.View 
                  key={item.title} 
                  animation="fadeInLeft" 
                  delay={index * 100}
                >
                  <TouchableOpacity 
                    style={[
                      styles.settingsItem,
                      dynamicStyles.settingsItem,
                      item.danger && styles.dangerItem
                    ]}
                    onPress={item.action}
                  >
                    <View style={styles.settingsLeft}>
                      <View style={[
                        styles.settingsIcon,
                        dynamicStyles.settingsIcon,
                        item.danger && styles.dangerIcon
                      ]}>
                        <item.icon size={20} color={item.danger ? "#FF4444" : (isDark ? "#FFFFFF" : "#000000")} />
                      </View>
                      <Text style={[
                        styles.settingsTitle,
                        dynamicStyles.settingsTitle,
                        item.danger && styles.dangerText
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                    
                    {item.toggle !== undefined ? (
                      <View style={[
                        styles.toggleSwitch,
                        dynamicStyles.toggleSwitch,
                        item.toggle && styles.toggleActive
                      ]}>
                        {isDark ? <Moon size={16} color="#FFFFFF" /> : <Sun size={16} color="#FFFFFF" />}
                      </View>
                    ) : (
                      <ChevronRight size={20} color={item.danger ? "#FF4444" : (isDark ? "#666666" : "#999999")} />
                    )}
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Premium Modal */}
      <Modal
        visible={premiumVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPremiumVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.premiumModal, dynamicStyles.settingsModal]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>SPMind Plus</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setPremiumVisible(false)}
              >
                <X size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.premiumModalContent}>
              <Text style={[styles.premiumDescription, dynamicStyles.settingsTitle]}>
                Choose your subscription plan
              </Text>

              {/* Plan 1: 1 Subject */}
              <Animatable.View animation="fadeInUp" delay={100}>
                <TouchableOpacity 
                  style={[styles.planCard, dynamicStyles.menuItem]}
                  onPress={() => handlePremiumSelect('1 Subject', 'RM38')}
                >
                  <View style={styles.planContent}>
                    <View style={styles.planLeft}>
                      <View style={[styles.planIcon, { backgroundColor: '#FF8C00' }]}>
                        <BookOpen size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.planDetails}>
                        <Text style={[styles.planTitle, dynamicStyles.modalTitle]}>1 Subject</Text>
                        <Text style={[styles.planSubtitle, dynamicStyles.userRank]}>Perfect for focused learning</Text>
                      </View>
                    </View>
                    <View style={styles.planPriceContainer}>
                      <Text style={[styles.planPrice, dynamicStyles.modalTitle]}>RM38</Text>
                      <Text style={[styles.planPeriod, dynamicStyles.userRank]}>/month</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>

              {/* Plan 2: 5 Subjects */}
              <Animatable.View animation="fadeInUp" delay={200}>
                <TouchableOpacity 
                  style={[styles.planCard, styles.popularPlan, dynamicStyles.menuItem]}
                  onPress={() => handlePremiumSelect('5 Subjects', 'RM98')}
                >
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                  <View style={styles.planContent}>
                    <View style={styles.planLeft}>
                      <View style={[styles.planIcon, { backgroundColor: '#FF9800' }]}>
                        <GraduationCap size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.planDetails}>
                        <Text style={[styles.planTitle, dynamicStyles.modalTitle]}>5 Subjects</Text>
                        <Text style={[styles.planSubtitle, dynamicStyles.userRank]}>Best value for all subjects</Text>
                      </View>
                    </View>
                    <View style={styles.planPriceContainer}>
                      <Text style={[styles.planPrice, dynamicStyles.modalTitle]}>RM98</Text>
                      <Text style={[styles.planPeriod, dynamicStyles.userRank]}>/month</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>

              {/* Features List */}
              <View style={styles.featuresContainer}>
                <Text style={[styles.featuresTitle, dynamicStyles.settingsTitle]}>
                  All plans include:
                </Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Check size={16} color="#FF8C00" />
                    <Text style={[styles.featureText, dynamicStyles.userRank]}>Unlimited AI tutoring</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Check size={16} color="#FF8C00" />
                    <Text style={[styles.featureText, dynamicStyles.userRank]}>24/7 homework help</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Check size={16} color="#FF8C00" />
                    <Text style={[styles.featureText, dynamicStyles.userRank]}>Step-by-step solutions</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Check size={16} color="#FF8C00" />
                    <Text style={[styles.featureText, dynamicStyles.userRank]}>Progress tracking</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 30,
    backgroundColor: '#FF8C00',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  profileSection: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  profileHorizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FF8C00',
    fontWeight: '700',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF8C00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  userDetails: {
    alignItems: 'center',
  },
  userDetailsRight: {
    flex: 1,
    justifyContent: 'center',
  },
  nameUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  username: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userHandleInline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    fontWeight: '400',
    opacity: 0.8,
  },
  userHandle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#999999',
    marginBottom: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  levelBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  levelBadgeIcon: {
    fontSize: 16,
  },
  userLevel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userSchool: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginBottom: 3,
    opacity: 0.9,
  },
  userGrade: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userRank: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 4,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    fontWeight: '500',
  },
  premiumSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  premiumCard3D: {
    borderRadius: 16,
    overflow: 'visible',
    position: 'relative',
  },
  premiumCard3DShadow: {
    position: 'absolute',
    bottom: -8,
    left: 4,
    right: 4,
    height: 8,
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    opacity: 0.4,
  },
  premiumCard3DContent: {
    padding: 22,
    borderRadius: 16,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  premiumContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  premiumIconContainer3D: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  premiumTitle3D: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: '700',
  },
  premiumSubtitle3D: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  premiumArrow3D: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 16,
    fontWeight: '700',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuContainer: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#000000',
    fontWeight: '500',
  },
  rankingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  rankingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  levelBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
  },
  levelNumber: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  currentRank: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 2,
    fontWeight: '700',
  },
  rankDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  rankingProgress: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 20,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#000000',
    marginBottom: 8,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextRankText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  achievementsScroll: {
    paddingHorizontal: 4,
    gap: 12,
  },
  achievementCard: {
    width: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementEarned: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF8C00',
    borderWidth: 2,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  achievementHeader: {
    marginBottom: 16,
  },
  achievementSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginTop: 4,
  },
  achievementLoadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  achievementProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  settingsContent: {
    padding: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  dangerItem: {
    borderBottomColor: 'rgba(255, 68, 68, 0.2)',
  },
  dangerIcon: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  dangerText: {
    color: '#FF4444',
  },
  toggleSwitch: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  toggleActive: {
    backgroundColor: '#FF8C00',
  },
  notificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  notificationDropdown: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 320,
    maxHeight: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  notificationList: {
    maxHeight: 320,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    position: 'relative',
  },
  notificationUnread: {
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginBottom: 4,
    lineHeight: 16,
  },
  notificationTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#999999',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C00',
  },
  emptyNotificationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginTop: 16,
    textAlign: 'center',
  },
  editProfileModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editProfileContent: {
    padding: 20,
  },
  editSection: {
    marginBottom: 24,
  },
  editSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#FF8C00',
    borderWidth: 2,
  },
  avatarOptionEmoji: {
    fontSize: 32,
  },
  avatarCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  currentAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  currentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  currentAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF8C00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  orText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999999',
    marginBottom: 12,
    textAlign: 'center',
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  usernamePrefix: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  premiumModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  premiumModalContent: {
    padding: 20,
  },
  premiumDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  popularPlan: {
    borderColor: '#FF8C00',
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF8C00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    letterSpacing: 1,
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDetails: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  featuresContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
});