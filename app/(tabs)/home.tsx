import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  Animated,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { ArrowRight, Bell, X, Trophy, Award, Zap, MessageSquare } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../contexts/AuthContext';
import SimpleAvatarInteraction from '../../components/SimpleAvatarInteraction';
import AvatarSoundSystem from '../../components/AvatarSoundSystem';
import * as Animatable from 'react-native-animatable';
import { Audio } from 'expo-av';
import { streakService } from '../../services/streakService';
import { supabase } from '../../services/supabase';
import { cacheService } from '../../services/cacheService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('english');
  const router = useRouter();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  
  // Streak state
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weekProgress, setWeekProgress] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [weekDates, setWeekDates] = useState<Array<{ date: number; day: string; isToday: boolean; month: string }>>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Dynamic animations for streak and bubble
  const flameScale = useRef(new Animated.Value(1)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const bubbleFloat = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const pageFadeAnim = useRef(new Animated.Value(0)).current;

  // Preload all images for instant switching
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState('');
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const fullText = `Hello ${firstName}, what would you like to learn today?`;
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  // Audio state
  const [introSound, setIntroSound] = useState<Audio.Sound | null>(null);
  
  // Notification state
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Page fade-in animation on mount (faster for better UX)
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 150, // Reduced from 300ms for faster load
      useNativeDriver: true,
    }).start();
  }, []);

  // Flame pulsing animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(flameScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    
    // Cleanup - Stop animation when component unmounts
    return () => animation.stop();
  }, []);

  // Bubble subtle floating animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleFloat, {
          toValue: -4,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleFloat, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    
    // Cleanup - Stop animation when component unmounts
    return () => animation.stop();
  }, []);

  // Bubble breathing animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleScale, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    
    // Cleanup - Stop animation when component unmounts
    return () => animation.stop();
  }, []);

  // Load user streak with caching
  useEffect(() => {
    const loadStreak = async () => {
      if (user?.id) {
        try {
          // Try cache first (5 minute cache)
          const cached = await cacheService.get<any>(`streak_${user.id}`, 5);
          if (cached) {
            console.log('📦 Using cached streak data');
            setCurrentStreak(cached.current_streak);
            setLongestStreak(cached.longest_streak);
            setWeekProgress(cached.week_progress);
            setWeekDates(cached.week_dates);
            return;
          }

          // Cache miss, fetch from database
          const streakData = await streakService.getUserStreak(user.id);
          if (streakData) {
            setCurrentStreak(streakData.current_streak);
            setLongestStreak(streakData.longest_streak);
            
            // Get actual week dates
            const dates = streakService.getWeekDates();
            setWeekDates(dates);
            
            // Get week session status
            const weekStatus = await streakService.getWeekSessionDays(user.id, streakData.last_session_date);
            setWeekProgress(weekStatus);
            
            // Cache the combined result
            await cacheService.set(`streak_${user.id}`, {
              current_streak: streakData.current_streak,
              longest_streak: streakData.longest_streak,
              week_progress: weekStatus,
              week_dates: dates,
            }, 5);
          } else {
            // No streak data yet, still show current week dates
            const dates = streakService.getWeekDates();
            setWeekDates(dates);
          }
        } catch (error) {
          console.error('Error loading streak:', error);
        }
      }
    };

    loadStreak();

    // Reload streak less frequently to improve performance
    const interval = setInterval(loadStreak, 30000); // Refresh every 30 seconds (was 5 seconds)
    
    return () => clearInterval(interval);
  }, [user]);

  // Fetch notifications from database with caching
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user?.id) {
        setLoadingNotifications(true);
        try {
          // Try cache first (1 minute cache)
          const cached = await cacheService.get<any[]>(`notifications_${user.id}`, 1);
          if (cached) {
            console.log('📦 Using cached notifications');
            setNotifications(cached);
            setLoadingNotifications(false);
            return;
          }

          // Cache miss, fetch from database
          const { data, error } = await supabase
            .rpc('get_user_notifications', { p_user_id: user.id, p_limit: 50 });

          if (!error && data) {
            setNotifications(data);
            // Cache for 1 minute
            await cacheService.set(`notifications_${user.id}`, data, 1);
          } else {
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

  // Fetch unread notification count with caching
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user?.id) {
        try {
          // Try cache first (30 second cache)
          const cached = await cacheService.get<number>(`unread_count_${user.id}`, 0.5);
          if (cached !== null) {
            console.log('📦 Using cached unread count');
            setUnreadCount(cached);
            return;
          }

          // Cache miss, fetch from database
          const { data, error } = await supabase
            .rpc('get_unread_notification_count', { p_user_id: user.id });

          if (!error && data !== null) {
            setUnreadCount(data);
            // Cache for 30 seconds
            await cacheService.set(`unread_count_${user.id}`, data, 0.5);
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

  // Load and play intro audio (non-blocking for faster page load)
  useEffect(() => {
    const loadAndPlayIntro = async () => {
      try {
        // Load the intro audio file
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/images/intro.mp3')
        );
        setIntroSound(sound);
        
        // Play the audio
        sound.playAsync().catch(error => {
          console.log('Error playing intro audio:', error);
        });
      } catch (error) {
        console.log('Error loading intro audio:', error);
      }
    };

    // Delay intro audio to not block initial page render
    setTimeout(() => {
      loadAndPlayIntro();
    }, 500);

    // Cleanup function to unload audio when component unmounts
    return () => {
      if (introSound) {
        introSound.unloadAsync();
      }
    };
  }, []);

  // Cleanup intro sound when component unmounts
  useEffect(() => {
    return () => {
      if (introSound) {
        introSound.unloadAsync();
      }
    };
  }, [introSound]);

  // Typewriter effect - types once and stays
  useEffect(() => {
    let currentIndex = 0;
    
    const typewriterInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        // Stop typing when done and mark complete
        setIsTypingComplete(true);
        clearInterval(typewriterInterval);
      }
    }, 60); // Faster typing speed

    return () => clearInterval(typewriterInterval);
  }, [fullText]);

  // Preload all images on component mount for instant category switching
  useEffect(() => {
    const preloadImages = async () => {
      try {
        console.log('🖼️ Prefetching images for instant switching...');
        
        // Preload all subject images with individual error handling
        const imagePromises = [
          // Jom Tanya images - use resolveAssetSource for safety
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/jomTanyaBI.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/jomTanyaBM.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/jomTanyaMath.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/jomTanyaSains.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/jomTanyaSejarah.png')).uri),
          // Memory Stretch images
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/EnglishRecap.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/BMRecap.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/MathRecap.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/ScienceRecap.png')).uri),
          Image.prefetch(Image.resolveAssetSource(require('../../assets/images/SejarahRecap.png')).uri),
        ].map(promise => promise.catch(err => {
          console.warn('Failed to prefetch image:', err);
          return null;
        }));
        
        await Promise.allSettled(imagePromises);
        console.log('✅ Images prefetched successfully');
        setImagesLoaded(true);
      } catch (error) {
        console.log('Image preloading error:', error);
        setImagesLoaded(true); // Continue anyway
      }
    };

    preloadImages();
  }, []);

  // Smooth category change animation
  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === selectedCategory) return;

    // Start exit animation
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change category
      setSelectedCategory(categoryId);
      
      // Start enter animation
      Animated.parallel([
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Function to get the correct Jom Tanya image based on selected subject
  const getJomTanyaImage = (subject: string) => {
    switch (subject) {
      case 'english':
        return require('../../assets/images/jomTanyaBI.png');
      case 'bahasa':
        return require('../../assets/images/jomTanyaBM.png');
      case 'maths':
        return require('../../assets/images/jomTanyaMath.png');
      case 'science':
        return require('../../assets/images/jomTanyaSains.png');
      case 'sejarah':
        return require('../../assets/images/jomTanyaSejarah.png');
      default:
        return require('../../assets/images/jomTanyaBI.png'); // Default to English
    }
  };

  // Function to get the correct Memory Stretch image based on selected subject
  const getMemoryStretchImage = (subject: string) => {
    switch (subject) {
      case 'english':
        return require('../../assets/images/EnglishRecap.png');
      case 'bahasa':
        return require('../../assets/images/BMRecap.png');
      case 'maths':
        return require('../../assets/images/MathRecap.png');
      case 'science':
        return require('../../assets/images/ScienceRecap.png');
      case 'sejarah':
        return require('../../assets/images/SejarahRecap.png');
      default:
        return require('../../assets/images/EnglishRecap.png'); // Default to English
    }
  };

  const categories = [
    { id: 'english', label: 'English' },
    { id: 'bahasa', label: 'Bahasa Malaysia' },
    { id: 'maths', label: 'Maths' },
    { id: 'science', label: 'Science' },
    { id: 'sejarah', label: 'Sejarah' },
  ];

  // Function to get the appropriate color style for each category
  const getCategoryColorStyle = (categoryId: string) => {
    switch (categoryId) {
      case 'english':
        return styles.englishButton;
      case 'bahasa':
        return styles.bahasaButton;
      case 'maths':
        return styles.mathsButton;
      case 'science':
        return styles.scienceButton;
      case 'sejarah':
        return styles.sejarahButton;
      default:
        return styles.englishButton;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'level_up': return Trophy;
      case 'achievement': return Award;
      case 'streak': return Zap;
      default: return MessageSquare;
    }
  };

  const getNotificationIconColor = (type: string, iconColor?: string) => {
    if (iconColor) return iconColor;
    switch (type) {
      case 'level_up': return '#FFD700';
      case 'achievement': return '#00FF00';
      case 'streak': return '#FF9800';
      default: return '#4ECDC4';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      await supabase.rpc('mark_notification_read', { p_notification_id: notification.id });
      setNotifications(prevNotifications =>
        prevNotifications.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotificationsVisible(false);
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
        setNotifications(prevNotifications => prevNotifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const contentCards = [
    {
      id: 'learn-alphabets',
      title: 'Daily Mind Boost',
      subtitle: 'Introduction',
      illustration: 'laptop',
    },
    {
      id: 'live-class',
      title: 'Join Live Class?',
      illustration: 'unicorn',
    },
    {
      id: 'alphabet-writing',
      title: 'Alphabet Writing?',
      illustration: 'hat',
    },
  ];


  return (
    <SimpleAvatarInteraction enableTimeBased={true}>
    <Animated.View style={[styles.container, { opacity: pageFadeAnim }]}>
      <AvatarSoundSystem enableSounds={false} volume={0.7} />
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Loading overlay */}
      {!imagesLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/bg.jpg')}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        <BlurView intensity={10} style={styles.headerBlurOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              <Text style={styles.greetingNormal}>Welcome back, </Text>
              <Text style={styles.greetingBold}>{user?.full_name || 'Student'}!</Text>
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.notificationContainer}
            onPress={() => setNotificationsVisible(!notificationsVisible)}
          >
            <Bell size={24} color="#FFFFFF" />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      {/* Avatar and Text Bubble Section */}
      <View style={styles.avatarSection}>
        {/* Spline Avatar */}
        {isFocused && (
          <View style={styles.avatarContainer}>
            <WebView
              source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                  <style>
                    * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                    }
                    html, body {
                      width: 100%;
                      height: 100%;
                      background: transparent;
                      overflow: hidden;
                    }
                    spline-viewer {
                      width: 100%;
                      height: 100%;
                      background: transparent;
                      display: block;
                    }
                    
                    /* Hide Spline watermark */
                    #logo, .logo, [class*="logo"], [id*="logo"],
                    a[href*="spline"], a[target="_blank"],
                    div[style*="position: absolute"][style*="bottom"],
                    div[style*="position: fixed"][style*="bottom"] {
                      display: none !important;
                      opacity: 0 !important;
                      visibility: hidden !important;
                      pointer-events: none !important;
                    }
                  </style>
                </head>
                <body>
                  <script type="module" src="https://unpkg.com/@splinetool/viewer@1.10.57/build/spline-viewer.js"></script>
                  <spline-viewer url="https://prod.spline.design/ZvT-Z5bOGCW9tJds/scene.splinecode"></spline-viewer>
                  
                  <script>
                    // Remove watermark after load
                    window.addEventListener('load', function() {
                      setTimeout(function() {
                        const viewer = document.querySelector('spline-viewer');
                        if (viewer && viewer.shadowRoot) {
                          const style = document.createElement('style');
                          style.textContent = \`
                            #logo, .logo, [class*="logo"], [id*="logo"],
                            a, a[href*="spline"],
                            div[style*="position: absolute"][style*="bottom"],
                            div[style*="position: fixed"][style*="bottom"] {
                              display: none !important;
                              opacity: 0 !important;
                              visibility: hidden !important;
                            }
                          \`;
                          try {
                            viewer.shadowRoot.appendChild(style);
                          } catch(e) {
                            console.log('Could not hide watermark:', e);
                          }
                        }
                      }, 500);
                    });
                  </script>
                </body>
                </html>
              `
            }}
            style={styles.splineViewer}
            androidLayerType="hardware"
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            onMemoryWarning={() => console.log('Spline WebView memory warning')}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={false}
            backgroundColor="transparent"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="compatibility"
            onLoadStart={() => {}}
            onLoadEnd={() => {}}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
            }}
          />
        </View>
        )}

        
        {/* Animated Text Bubble - Beside Spline */}
        <Animated.View style={[
          styles.bubbleWrapper,
          { 
            transform: [
              { translateY: bubbleFloat },
              { scale: bubbleScale }
            ] 
          }
        ]}>
          <Animatable.View 
            animation="fadeInRight"
            delay={500}
            duration={800}
            style={styles.textBubble}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8F9FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bubbleGradient}
            >
              <Text style={styles.bubbleText}>
                {displayedText}
              </Text>
            </LinearGradient>
            <View style={styles.bubbleTriangle} />
            <View style={styles.bubbleGlow} />
          </Animatable.View>
        </Animated.View>
      </View>

      {/* Streak Section - After Avatar */}
      <View style={styles.streakSection}>
        <Animatable.View 
          animation="fadeInUp"
          delay={600}
          duration={800}
          style={styles.streakContainer}
        >
          <LinearGradient
            colors={['#4A1F1F', '#661D1D', '#1F1F1F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakGradient}
          >
            {/* Headline on top */}
            <View style={styles.streakHeader}>
              <Text style={styles.streakTitle}>
                {currentStreak > 0 
                  ? `${currentStreak} Days streak, You're on fire!`
                  : "Start your streak today!"}
              </Text>
            </View>

            {/* Fire icon and progress */}
            <View style={styles.streakContent}>
              <View style={styles.streakLeftSection}>
                <View style={styles.flameIconContainer}>
                  <Animated.Text style={[
                    styles.flameEmoji,
                    { transform: [{ scale: flameScale }] }
                  ]}>
                    🔥
                  </Animated.Text>
                  <Text style={styles.streakNumber}>{currentStreak}</Text>
                </View>
              </View>
              <View style={styles.streakRightSection}>
                <View style={styles.weeklyProgress}>
                  {weekDates.map((dayInfo, index) => (
                    <Animatable.View
                      key={`${dayInfo.month}-${dayInfo.date}`}
                      animation="bounceIn"
                      delay={700 + (index * 100)}
                      duration={600}
                      style={styles.dayContainer}
                    >
                      <LinearGradient
                        colors={
                          weekProgress[index]
                            ? ['#EF4444', '#DC2626', '#B91C1C']
                            : ['rgba(153, 27, 27, 0.3)', 'rgba(127, 29, 29, 0.2)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.dayCircle,
                          dayInfo.isToday && styles.todayHighlight
                        ]}
                      >
                        {weekProgress[index] ? (
                          <Text style={styles.checkmark}>✓</Text>
                        ) : (
                          <Text style={styles.xMark}>✗</Text>
                        )}
                      </LinearGradient>
                      <Text style={styles.dateNumber}>{dayInfo.date}</Text>
                      <Text style={styles.dayLabel}>{dayInfo.day}</Text>
                    </Animatable.View>
                  ))}
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>
      </View>

      {/* Fixed Complete Section */}
      <View style={styles.fixedCompleteSection}>
        <View style={styles.fixedCompleteContainer}>
            {/* Main Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.mainQuestion}>
                What would you like to learn today?
                <Text style={styles.orangeArrow}> ↗</Text>
              </Text>
            </View>

            {/* Subject Categories Container */}
            <View style={styles.categoriesWrapper}>
            {/* Top Dashed Line */}
            <View style={styles.categoriesDashedLineTop}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.dash} />
              ))}
            </View>
            
            {/* 2-Row Subject Grid */}
            <View style={styles.categoriesGrid}>
              {/* First Row */}
              <View style={styles.categoriesRow}>
                {categories.slice(0, 3).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      getCategoryColorStyle(category.id),
                      selectedCategory === category.id && styles.selectedCategoryButton,
                    ]}
                    onPress={() => handleCategoryChange(category.id)}
                  >
                    <Text style={[
                      styles.categoryText,
                      category.id === 'bahasa' && styles.bahasaText,
                      category.id === 'english' && styles.englishText,
                      selectedCategory === category.id && styles.selectedCategoryText,
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Second Row */}
              <View style={styles.categoriesRow}>
                {categories.slice(3).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      getCategoryColorStyle(category.id),
                      selectedCategory === category.id && styles.selectedCategoryButton,
                    ]}
                    onPress={() => handleCategoryChange(category.id)}
                  >
                    <Text style={[
                      styles.categoryText,
                      category.id === 'bahasa' && styles.bahasaText,
                      category.id === 'english' && styles.englishText,
                      selectedCategory === category.id && styles.selectedCategoryText,
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Bottom Dashed Line */}
            <View style={styles.categoriesDashedLineBottom}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.dash} />
              ))}
            </View>
          </View>

          {/* Daily Brain Boost Image - Now at the top */}
          <TouchableOpacity 
            style={styles.fullScreenImageContainer}
            onPress={() => router.push({
              pathname: '/daily-brain-boost',
              params: { subject: selectedCategory }
            })}
          >
            <Animated.View style={[
              styles.fullScreenImageWrapper,
              {
                opacity: imageOpacity,
                transform: [{ scale: imageScale }]
              }
            ]}>
              <Image 
                source={require('../../assets/images/dailybrainboost.png')}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Content Cards */}
          <View style={styles.cardsContainer}>
            {/* Second Row - Two Cards */}
            <View style={styles.cardsRow}>
              {/* Live Class Card */}
              <TouchableOpacity 
                style={styles.liveClassCard} 
                onPress={() => router.push({
                  pathname: '/quiz',
                  params: { subject: selectedCategory }
                })}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.imageContainer,
                  {
                    opacity: imageOpacity,
                    transform: [{ scale: imageScale }]
                  }
                ]}>
                  <Image 
                    source={getMemoryStretchImage(selectedCategory)}
                    style={styles.liveClassImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </TouchableOpacity>

              {/* Jom Tanya Card - Dynamic based on selected subject */}
              <TouchableOpacity 
                style={styles.alphabetCard}
                onPress={() => router.push('/avatar' as any)}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.imageContainer,
                  {
                    opacity: imageOpacity,
                    transform: [{ scale: imageScale }]
                  }
                ]}>
                  <Image 
                    source={getJomTanyaImage(selectedCategory)}
                    style={styles.alphabetImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
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
            style={styles.notificationDropdown}
          >
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={handleMarkAllAsRead}>
                    <Text style={{ color: '#00FF00', fontSize: 14, fontFamily: 'Inter-Medium' }}>
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
              {loadingNotifications ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#00FF00" />
                </View>
              ) : notifications.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Bell size={48} color="#666666" />
                  <Text style={styles.emptyNotificationText}>
                    No notifications yet
                  </Text>
                </View>
              ) : (
                notifications.map((notification, index) => {
                  const NotificationIcon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationIconColor(notification.type, notification.icon_color);
                  
                  return (
                    <TouchableOpacity 
                      key={notification.id} 
                      style={[
                        styles.notificationItem,
                        !notification.read && styles.notificationUnread
                      ]}
                      onPress={() => handleNotificationClick(notification)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notificationIconContainer, { backgroundColor: `${iconColor}20` }]}>
                        <NotificationIcon size={18} color={iconColor} />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationItemTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {notification.time_ago}
                        </Text>
                      </View>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Animatable.View>
        </TouchableOpacity>
      )}
    </Animated.View>
    </SimpleAvatarInteraction>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  fixedCompleteSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  fixedCompleteContainer: {
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 6,
    padding: 20,
    backgroundColor: '#1F1F1F',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  streakSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: -40,
    marginBottom: 4,
  },
  streakContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 100,
    zIndex: 99999,
    marginTop: -40,
  },
  streakGradient: {
    padding: 20,
    borderRadius: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 1000,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  headerBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
    zIndex: 3,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  greetingNormal: {
    fontWeight: '400',
  },
  greetingBold: {
    fontWeight: '700',
  },
  notificationContainer: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    marginBottom: 20,
    paddingTop: 5,
    justifyContent: 'flex-start',
    marginLeft: 10,
    marginTop: -20,
  },
  avatarContainer: {
    width: 200,
    height: 240,
    marginLeft: 0,
    marginTop: 0,
  },
  bubbleWrapper: {
    flex: 1,
    marginLeft: 5,
    marginTop: 60,
    marginRight: 10,
    alignSelf: 'flex-start',
  },
  textBubble: {
    borderRadius: 20,
    overflow: 'visible',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bubbleGradient: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(79, 70, 229, 0.1)',
    minHeight: 70,
  },
  bubbleGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.05)',
    zIndex: -1,
  },
  bubbleText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    lineHeight: 20,
    letterSpacing: 0.1,
    flexWrap: 'wrap',
  },
  cursor: {
    opacity: 0.7,
  },
  bubbleTriangle: {
    position: 'absolute',
    left: -9,
    top: 20,
    width: 0,
    height: 0,
    borderRightWidth: 12,
    borderRightColor: '#FFFFFF',
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    shadowColor: '#4F46E5',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  splineViewer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    margin: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#0A0A0A',
    overflow: 'hidden',
  },
  questionContainer: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 16,
  },
  mainQuestion: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  orangeArrow: {
    color: '#F97316',
    fontSize: 28,
  },
  dashedLine: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: '#6B7280',
    borderStyle: 'dashed',
    marginVertical: 15,
  },
  whiteDashedLine: {
    height: 2,
    borderTopWidth: 2,
    borderTopColor: '#FFFFFF',
    borderStyle: 'dashed',
    marginVertical: 15,
    width: '100%',
  },
  dashedLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: -12,
    width: '100%',
    paddingTop: 8,
    paddingBottom: -16,
    paddingHorizontal: 0,
  },
  dash: {
    width: 8,
    height: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    opacity: 0.8,
  },
  dashedLineContainerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    width: '100%',
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 0,
  },
  categoriesWrapper: {
    marginVertical: 0,
    marginBottom: 8,
    paddingVertical: 12,
  },
  categoriesDashedLineTop: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  categoriesDashedLineBottom: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  categoriesGrid: {
    paddingHorizontal: 0,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategoryButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF8E53',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  englishButton: {
    backgroundColor: '#FFB3B3', // Red pastel
    borderColor: '#FF9999',
  },
  bahasaButton: {
    backgroundColor: '#FFDFBA', // Pastel peach
    borderColor: '#FFCC99',
  },
  mathsButton: {
    backgroundColor: '#FFFFBA', // Pastel yellow
    borderColor: '#FFFF99',
  },
  scienceButton: {
    backgroundColor: '#BAFFC9', // Pastel green
    borderColor: '#99FFB3',
  },
  sejarahButton: {
    backgroundColor: '#BAE1FF', // Pastel blue
    borderColor: '#99D3FF',
  },
  bahasaText: {
    color: '#000000',
  },
      englishText: {
        color: '#000000', // Black color for English button text
      },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 0,
    gap: 20,
  },
  fullCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  cardBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  fullScreenImageContainer: {
    marginTop: 0,
    marginBottom: 0,
  },
  fullScreenImageWrapper: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  halfCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 24,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  liveClassCard: {
    flex: 1,
    height: 120,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 2,
  },
  alphabetCard: {
    flex: 1,
    height: 120,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 2,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  liveClassImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  alphabetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardTextContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  cardButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    backdropFilter: 'blur(20px)',
  },
  streakHeader: {
    marginBottom: 20,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakLeftSection: {
    alignItems: 'center',
  },
  flameIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  flameEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  streakRightSection: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  weeklyProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  completedDay: {
    backgroundColor: '#B91C1C',
    borderWidth: 0,
  },
  currentDay: {
    backgroundColor: '#7F1D1D',
    borderWidth: 0,
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingDay: {
    backgroundColor: '#991B1B',
    borderWidth: 1,
    borderColor: '#B91C1C',
    opacity: 0.3,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xMark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  flameIconSmall: {
    fontSize: 16,
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.6,
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  todayHighlight: {
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.1 }],
  },
  // Notification Styles
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
    backgroundColor: '#00FF00',
  },
  emptyNotificationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginTop: 16,
    textAlign: 'center',
  },
});