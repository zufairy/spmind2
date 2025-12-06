import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Users2,
  Trophy,
  Zap,
  ArrowDown,
  X,
  Lock,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import LockedFeaturePopup from '../../components/LockedFeaturePopup';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function CommunityScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeStudyGroup, setActiveStudyGroup] = useState(0);
  const [activeGame, setActiveGame] = useState(0);
  const [selectedLeaderboardTab, setSelectedLeaderboardTab] = useState('Region');
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [topTenData, setTopTenData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const [showLockedPopup, setShowLockedPopup] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');

  // Fetch real leaderboard data from database
  useEffect(() => {
    fetchLeaderboard();
  }, [selectedLeaderboardTab, user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching ${selectedLeaderboardTab} leaderboard...`);
      
      // Query all users with points (note: may be limited by RLS)
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, username, points, avatar_url')
        .order('points', { ascending: false })
        .limit(100);
      
      const leaderboardUsers = data as any[];

      if (error) {
        console.error('❌ Database error:', error);
        console.error('❌ This is likely due to Row Level Security (RLS) blocking the query');
        console.error('❌ Solution: Run database/migrations/add_leaderboard_function.sql in Supabase SQL Editor');
        setTopTenData([]);
        setLeaderboardData([]);
        setLoading(false);
        return;
      }
      
      console.log(`✅ Loaded ${leaderboardUsers?.length || 0} users from database`);
      console.log('📊 Raw leaderboard data:', leaderboardUsers);
      
      // Check if RLS is blocking (only showing current user)
      const userList = leaderboardUsers as any[];
      if (Array.isArray(userList) && userList.length === 1 && userList[0]?.id === user?.id) {
        console.error('⚠️⚠️⚠️ IMPORTANT: Only seeing YOUR user!');
        console.error('⚠️ Row Level Security (RLS) is blocking other users');
        console.error('⚠️ Solution: Run this SQL in Supabase SQL Editor:');
        console.error('⚠️ File: database/migrations/add_leaderboard_function.sql');
      }
      
      // If we have fewer users, still show them
      const usersToDisplay = Array.isArray(leaderboardUsers) ? leaderboardUsers : [];
      
      if (usersToDisplay.length === 0) {
        console.log('⚠️ No users with points found in database');
        setTopTenData([]);
        setLeaderboardData([]);
        setLoading(false);
        return;
      }
      
      // Transform data to match UI format
      const transformedData = usersToDisplay.map((lbUser: any, index: number) => ({
        id: lbUser.id,
        rank: index + 1,
        name: lbUser.full_name || 'Student',
        points: lbUser.points || 0,
        username: lbUser.username ? `@${lbUser.username}` : '@user',
        avatarColor: getAvatarColor(index),
        avatarInitial: (lbUser.full_name?.[0] || 'S').toUpperCase(),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        avatar_url: lbUser.avatar_url,
        isCurrentUser: lbUser.id === user?.id,
      }));

      setTopTenData(transformedData); // Show all users
      setLeaderboardData(transformedData.slice(0, 3)); // Top 3 for podium
      
      console.log(`📊 Top ${Math.min(7, transformedData.length)} users:`, transformedData.slice(0, 7).map((u: any) => ({ 
        name: u.name, 
        points: u.points
      })));
      
    } catch (error) {
      console.error('Exception fetching leaderboard:', error);
      setTopTenData([]);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get avatar colors
  const getAvatarColor = (index: number) => {
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#4A90E2', '#9B59B6', '#E74C3C', '#F39C12', '#27AE60', '#3498DB', '#E67E22'];
    return colors[index % colors.length];
  };

  // Page fade-in animation on mount (faster for better UX)
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 150, // Reduced from 300ms for faster load
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto-play for image carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current image
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentImageIndex * width,
        animated: true,
      });
    }
  }, [currentImageIndex]);

  const sliderImages = [
    {
      id: '1',
      uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
      title: 'Study Together',
      subtitle: 'Connect with fellow students',
    },
    {
      id: '2',
      uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
      title: 'Learn & Grow',
      subtitle: 'Share knowledge and experiences',
    },
    {
      id: '3',
      uri: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop',
      title: 'Achieve Goals',
      subtitle: 'Support each other\'s success',
    },
  ];

  const studyGroups = [
    {
      id: '1',
      name: 'Maths is EZ.',
      description: 'Master mathematics together with step-by-step problem solving',
      online: 24,
      topics: ['Algebra', 'Calculus'],
    },
    {
      id: '2',
      name: 'English Only Tau!',
      description: 'Improve English skills through conversation and practice',
      online: 18,
      topics: ['Grammar', 'Literature'],
    },
    {
      id: '3',
      name: 'Science Stream Geng',
      description: 'Explore scientific concepts and conduct experiments',
      online: 31,
      topics: ['Sejarah', 'Chemistry'],
    },
    {
      id: '4',
      name: 'Dak2 Karya',
      description: 'Creative writing and artistic expression community',
      online: 15,
      topics: ['Writing', 'Art'],
    },
  ];

  const miniGames = [
    {
      id: '1',
      name: 'Word Bomb',
      description: 'Type words before time runs out!',
      image: require('../../assets/images/wordbomb.png'),
      online: 0, // Will be dynamic based on active games
      difficulty: 'Medium',
      color: '#FF6B6B',
      route: '/word-bomb',
      locked: false,
    },
    {
      id: '2',
      name: 'Silat Master',
      description: 'Learn traditional martial arts',
      image: require('../../assets/images/silat.png'),
      online: 38,
      difficulty: 'Medium',
      color: '#4ECDC4',
      locked: true,
    },
    {
      id: '3',
      name: 'Spell Bird',
      description: 'Master spelling and vocabulary',
      image: require('../../assets/images/spellbird.png'),
      online: 42,
      difficulty: 'Hard',
      color: '#45B7D1',
      locked: true,
    },
  ];

  const handleGameClick = (game: any) => {
    if (game.locked) {
      setLockedFeatureName(game.name);
      setShowLockedPopup(true);
    } else if (game.route) {
      router.push(game.route as any);
    }
  };

  const handleGetGenius = () => {
    setShowLockedPopup(false);
    router.push('/subscriptions');
  };

  const getEmojiForGroup = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('math')) return '🧮 ';
    if (n.includes('english')) return '🗣️ ';
    if (n.includes('science')) return '🔬 ';
    if (n.includes('karya') || n.includes('write')) return '✍️ ';
    return '📚 ';
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    text: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    card: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    headerText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    subtitle: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    studyGroupCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
    },
    gameCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
    },
    topicChip: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    topicText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
  };

  return (
    <Animated.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      {/* Header - At the very top */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Community</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.gradient}>
          {/* Study with friends heading - outside container */}
          <Text style={styles.studyWithFriendsHeading}>Study with friends</Text>
          
          {/* Study with friends card */}
          <View style={styles.studyWithFriendsCard}>
            {/* Image container */}
            <View style={styles.studyImageContainer}>
              <Image 
                source={require('../../assets/images/game.png')} 
                style={styles.studyImage} 
                resizeMode="cover" 
              />
            </View>
            
            {/* Join button */}
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/(tabs)/lepak')} 
              style={styles.joinStudyButton}
            >
              <View style={styles.joinStudyButtonInner}>
                <Text style={styles.joinStudyButtonText}>Join Study with friends</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Mini Games Section */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniGamesContainer}
            style={styles.miniGamesScrollView}
          >
            {miniGames.map((game, index) => {
              // Split game name into words for tile display
              const gameWords = game.name.split(' ');
              const firstWord = gameWords[0] || '';
              const secondWord = gameWords[1] || '';
              
              // Get emoji for each game
              const getGameEmoji = (gameName: string) => {
                if (gameName.includes('Bomb')) return '💣';
                if (gameName.includes('Silat')) return '🥋';
                if (gameName.includes('Spell') || gameName.includes('Bird')) return '🐦';
                return '🎮';
              };
              
              const gameEmoji = getGameEmoji(game.name);
              
              return (
                <Animatable.View
                  key={game.id}
                  animation="fadeInUp"
                  delay={index * 150}
                  style={styles.wordBombCard}
                >
                  {/* Dark Blue Banner Section */}
                  <View style={styles.wordBombBanner}>
                    {/* Large Icon - Top Center */}
                    <View style={styles.wordBombLargeIcon}>
                      <Text style={styles.wordBombEmoji}>{gameEmoji}</Text>
                    </View>
                    
                    {/* First word in tiles */}
                    <View style={styles.wordTilesContainer}>
                      {firstWord.split('').map((letter, i) => (
                        <View key={i} style={styles.wordTile}>
                          <Text style={styles.wordTileText}>{letter}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {/* Second word in bold 3D style */}
                    {secondWord && (
                      <Text style={styles.bombText}>{secondWord}</Text>
                    )}
                    
                    {/* Small icon - bottom right */}
                    <View style={styles.wordBombSmallIcon}>
                      <Text style={styles.wordBombEmojiSmall}>{gameEmoji}</Text>
                    </View>
                    
                    {/* Online indicator badge - bottom left */}
                    <View style={styles.wordBombOnlineBadge}>
                      <View style={styles.wordBombOnlineDot} />
                      <Text style={styles.wordBombOnlineText}>{game.online} online</Text>
                    </View>
                  </View>
                  
                  {/* Button */}
                  <TouchableOpacity 
                    style={styles.wordBombButton}
                    onPress={() => handleGameClick(game)}
                    activeOpacity={0.9}
                  >
                    <View style={[
                      styles.wordBombButtonInner,
                      game.locked && styles.wordBombButtonLocked
                    ]}>
                      <Text style={styles.wordBombButtonText}>
                        {game.locked ? 'Coming Soon' : 'Start Game'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animatable.View>
              );
            })}
          </ScrollView>

          {/* Leaderboards headline */}
          <View style={styles.leaderboardHeadlineContainer}>
            <Text style={styles.leaderboardHeadlineText}>Leaderboards</Text>
          </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardSection}>
          {/* Tabs */}
          <View style={styles.leaderboardTabs}>
            {['Region', 'National', 'Global'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.leaderboardTab}
                onPress={() => {
                  console.log(`Switching to ${tab} tab`);
                  setSelectedLeaderboardTab(tab);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.leaderboardTabText,
                  selectedLeaderboardTab === tab && styles.leaderboardTabTextActive
                ]}>
                  {tab}
                </Text>
                {selectedLeaderboardTab === tab && (
                  <Animatable.View 
                    animation="fadeIn" 
                    duration={200}
                    style={styles.leaderboardTabIndicator} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading {selectedLeaderboardTab} leaderboard...</Text>
            </View>
          )}
          
          {/* No Data State */}
          {!loading && leaderboardData.length === 0 && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No users found</Text>
              <Text style={[styles.loadingText, { fontSize: 14, marginTop: 8 }]}>
                Run the SQL script to populate data
              </Text>
            </View>
          )}

          {/* Top 3 Podium */}
          {leaderboardData.length > 0 && (
          <View style={styles.topThreeContainer}>
            {/* 2nd Place - Left */}
            {leaderboardData[1] && (
              <Animatable.View
                animation="fadeInUp"
                delay={100}
                style={styles.secondPlaceContainer}
              >
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: leaderboardData[1].avatarColor }]}>
                    {leaderboardData[1].avatar_url ? (
                      <Image 
                        source={{ uri: leaderboardData[1].avatar_url }}
                        style={styles.topThreeAvatarImage}
                        defaultSource={require('../../assets/images/icon.png')}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarInitial}>{leaderboardData[1].avatarInitial}</Text>
                    )}
                  </View>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>2</Text>
                  </View>
                </View>
                <Text style={styles.topThreeName}>{leaderboardData[1].name}</Text>
                <Text style={styles.topThreePoints}>{leaderboardData[1].points}</Text>
                <Text style={styles.topThreeUsername}>{leaderboardData[1].username}</Text>
              </Animatable.View>
            )}

            {/* 1st Place - Center */}
            {leaderboardData[0] && (
              <Animatable.View
                animation="fadeInUp"
                delay={0}
                style={styles.firstPlaceContainer}
              >
                <Text style={styles.crownIcon}>👑</Text>
                <View style={styles.avatarContainerFirst}>
                  <View style={[styles.avatarPlaceholderFirst, { backgroundColor: leaderboardData[0].avatarColor }]}>
                    {leaderboardData[0].avatar_url ? (
                      <Image 
                        source={{ uri: leaderboardData[0].avatar_url }}
                        style={styles.topThreeAvatarImageFirst}
                        defaultSource={require('../../assets/images/icon.png')}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarInitialFirst}>{leaderboardData[0].avatarInitial}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.topThreeNameFirst}>{leaderboardData[0].name}</Text>
                <Text style={styles.topThreePointsFirst}>{leaderboardData[0].points}</Text>
                <Text style={styles.topThreeUsername}>{leaderboardData[0].username}</Text>
              </Animatable.View>
            )}

            {/* 3rd Place - Right */}
            {leaderboardData[2] && (
              <Animatable.View
                animation="fadeInUp"
                delay={200}
                style={styles.thirdPlaceContainer}
              >
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: leaderboardData[2].avatarColor }]}>
                    {leaderboardData[2].avatar_url ? (
                      <Image 
                        source={{ uri: leaderboardData[2].avatar_url }}
                        style={styles.topThreeAvatarImage}
                        defaultSource={require('../../assets/images/icon.png')}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarInitial}>{leaderboardData[2].avatarInitial}</Text>
                    )}
                  </View>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>3</Text>
                  </View>
                </View>
                <Text style={styles.topThreeName}>{leaderboardData[2].name}</Text>
                <Text style={styles.topThreePoints}>{leaderboardData[2].points}</Text>
                <Text style={styles.topThreeUsername}>{leaderboardData[2].username}</Text>
              </Animatable.View>
            )}
          </View>
          )}

          {/* Top 7 Leaderboard Section (Ranks 4-7) */}
          {topTenData.length > 3 && (
            <View style={styles.topFiveSection}>
              
              <View style={styles.topFiveList}>
                {topTenData.slice(3, 7).map((userData, index) => {
                  const rank = index + 4; // Ranks 4-7 (showing 4 more users after top 3)
                  const isCurrentUser = userData.isCurrentUser; // Check if this is the logged-in user
                  
                  return (
                    <Animatable.View
                      key={userData.id}
                      animation="fadeInUp"
                      delay={300 + (index * 100)}
                      style={[
                        styles.topFiveItem,
                        isCurrentUser && styles.currentUserHighlight
                      ]}
                    >
                      {/* Rank Badge */}
                      <View style={[
                        styles.rankBadgeContainer,
                        rank === 4 && styles.rankBadgeFourth,
                        rank === 5 && styles.rankBadgeFifth,
                        rank === 6 && styles.rankBadgeSixth,
                        rank === 7 && styles.rankBadgeSeventh,
                        rank === 8 && styles.rankBadgeEighth,
                      ]}>
                        <Text style={styles.rankBadgeNumber}>{rank}</Text>
                        {isCurrentUser && <Text style={styles.youBadge}>YOU</Text>}
                      </View>

                      {/* Avatar */}
                      <View style={[
                        styles.topFiveAvatar,
                        { backgroundColor: userData.avatarColor }
                      ]}>
                        {userData.avatar_url ? (
                          <Image 
                            source={{ uri: userData.avatar_url }}
                            style={styles.topFiveAvatarImage}
                          />
                        ) : (
                          <Text style={styles.topFiveAvatarInitial}>{userData.avatarInitial}</Text>
                        )}
                      </View>

                      {/* User Info */}
                      <View style={styles.topFiveUserInfo}>
                        <Text style={[
                          styles.topFiveName,
                          isCurrentUser && styles.currentUserName
                        ]}>
                          {isCurrentUser ? `${userData.name} (You)` : userData.name}
                        </Text>
                        <Text style={styles.topFiveUsername}>{userData.username}</Text>
                      </View>

                      {/* Points */}
                      <View style={styles.topFivePointsContainer}>
                        <Text style={[
                          styles.topFivePoints,
                          isCurrentUser && styles.currentUserPoints
                        ]}>
                          {userData.points}
                        </Text>
                        <Text style={styles.topFivePointsLabel}>pts</Text>
                      </View>
                    </Animatable.View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Show More Button */}
          {topTenData.length > 7 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowFullLeaderboard(true)}
            >
              <Text style={styles.showMoreButtonText}>Show All ({topTenData.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Full Leaderboard Modal */}
        <Modal
          visible={showFullLeaderboard}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFullLeaderboard(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  🏆 {selectedLeaderboardTab} Leaderboard
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowFullLeaderboard(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {topTenData.map((userData, index) => (
                  <Animatable.View
                    key={userData.id}
                    animation="fadeInUp"
                    delay={index * 50}
                    style={[
                      styles.modalLeaderboardItem,
                      userData.isCurrentUser && styles.currentUserHighlight
                    ]}
                  >
                    <View style={styles.modalRankContainer}>
                      <Text style={styles.modalRankText}>{userData.rank}</Text>
                    </View>
                    <View style={[styles.modalAvatar, { backgroundColor: userData.avatarColor }]}>
                      {userData.avatar_url ? (
                        <Image 
                          source={{ uri: userData.avatar_url }}
                          style={styles.modalAvatarImage}
                        />
                      ) : (
                        <Text style={styles.modalAvatarInitial}>{userData.avatarInitial}</Text>
                      )}
                    </View>
                    <View style={styles.modalUserInfo}>
                      <Text style={[
                        styles.modalUserName,
                        userData.isCurrentUser && styles.currentUserName
                      ]}>
                        {userData.isCurrentUser ? `${userData.name} (You)` : userData.name}
                      </Text>
                      <Text style={styles.modalUserUsername}>{userData.username}</Text>
                    </View>
                    <View style={styles.modalPointsContainer}>
                      <Text style={[
                        styles.modalPoints,
                        userData.isCurrentUser && styles.currentUserPoints
                      ]}>
                        {userData.points}
                      </Text>
                      <Text style={styles.modalPointsLabel}>pts</Text>
                    </View>
                  </Animatable.View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        </View>
      </ScrollView>

      {/* Locked Feature Popup */}
      <LockedFeaturePopup
        visible={showLockedPopup}
        onClose={() => setShowLockedPopup(false)}
        onGetGenius={handleGetGenius}
        featureName={lockedFeatureName}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  studyWithFriendsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  studyWithFriendsHeading: {
    fontSize: 20,
    color: '#000000',
    fontFamily: 'Fredoka-Regular',
    marginBottom: 16,
    marginHorizontal: 0,
    fontWeight: '600',
  },
  studyImageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  studyImage: {
    width: '100%',
    height: '100%',
  },
  joinStudyButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'visible',
  },
  joinStudyButtonInner: {
    backgroundColor: '#58CC02',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#4BA600',
    borderRightColor: '#4BA600',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinStudyButtonText: {
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  leaderboardHeadlineContainer: {
    marginTop: 32,
    marginBottom: 20,
    marginHorizontal: 0,
  },
  leaderboardHeadlineText: {
    fontSize: 20,
    color: '#000000',
    fontFamily: 'Fredoka-Regular',
    fontWeight: '600',
  },
  topBanner: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  topBannerImage: {
    width: '100%',
    height: '100%',
  },
  topBannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  topBannerContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  topBannerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  topBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: '#000000',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Fredoka-Regular',
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  leaderboardSection: {
    marginBottom: 25,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 24,
    marginHorizontal: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Leaderboard Tabs
  leaderboardTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardTab: {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center',
  },
  leaderboardTabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  leaderboardTabTextActive: {
    color: '#FFFFFF',
  },
  leaderboardTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3B82F6',
  },
  // Top 3 Container
  topThreeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  // First Place
  firstPlaceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  crownIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  avatarContainerFirst: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
    overflow: 'visible',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    position: 'relative',
  },
  avatarImageFirst: {
    width: '100%',
    height: '100%',
  },
  topThreeNameFirst: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  topThreePointsFirst: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  // Second and Third Place
  secondPlaceContainer: {
    alignItems: 'center',
    flex: 1,
    paddingTop: 40,
  },
  thirdPlaceContainer: {
    alignItems: 'center',
    flex: 1,
    paddingTop: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'visible',
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 40,
  },
  avatarInitial: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  topThreeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarPlaceholderFirst: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 50,
  },
  avatarInitialFirst: {
    fontSize: 40,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  topThreeAvatarImageFirst: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 100,
    elevation: 100,
  },
  rankBadgeText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  topThreeName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  topThreePoints: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  topThreeUsername: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Leaderboard List
  leaderboardList: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  leaderboardAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardAvatarInitial: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  leaderboardUsername: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaderboardPoints: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  trendIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendUp: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  showMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  showMoreButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    fontWeight: '600',
  },
  studyGroupsContainer: {
    paddingHorizontal: 10,
  },
  studyGroupCard: {
    width: width * 0.75,
    height: 160,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupContent: {
    flex: 1,
    position: 'relative',
  },
  groupName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 20,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 8,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
  },
  gameOnlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
  },
  topicTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  topicTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topicText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  joinButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  joinButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  miniGamesScrollView: {
    marginLeft: -16,
  },
  miniGamesContainer: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  gameCard: {
    width: width * 0.75,
    height: 160,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  gameImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  gameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
  },
  gameContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  gameName: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  gameDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginBottom: 10,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
  },
  onlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
  },
  startGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  lockedGameButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  startGameText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  lockedGameText: {
    color: '#FFD700',
  },
  // Word Bomb Special Design
  wordBombCard: {
    width: width * 0.75,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wordBombBanner: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
    position: 'relative',
    minHeight: 140,
  },
  wordBombLargeIcon: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 2,
  },
  wordBombEmoji: {
    fontSize: 40,
  },
  wordTilesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 8,
    gap: 4,
  },
  wordTile: {
    width: 32,
    height: 32,
    backgroundColor: '#F5E6D3',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4C4B0',
  },
  wordTileText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333333',
    fontWeight: '700',
  },
  bombText: {
    fontSize: 32,
    fontFamily: 'Fredoka-Bold',
    color: '#FFA500',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: '#FF8C00',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  wordBombSmallIcon: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    zIndex: 2,
  },
  wordBombEmojiSmall: {
    fontSize: 24,
  },
  wordBombOnlineBadge: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 2,
  },
  wordBombOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
  },
  wordBombOnlineText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#000000',
    fontWeight: '500',
  },
  wordBombButton: {
    width: '100%',
    borderRadius: 0,
    overflow: 'visible',
  },
  wordBombButtonInner: {
    backgroundColor: '#58CC02',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#4BA600',
    borderRightColor: '#4BA600',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wordBombButtonLocked: {
    backgroundColor: '#FF8C42',
    borderBottomColor: '#E55A2B',
    borderRightColor: '#E55A2B',
  },
  wordBombButtonText: {
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Loading styles
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalLeaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalRankContainer: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalRankText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: 50,
    height: 50,
  },
  modalAvatarInitial: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  modalUserUsername: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalPointsContainer: {
    alignItems: 'flex-end',
  },
  modalPoints: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFD700',
  },
  modalPointsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Top 5 Leaderboard Styles
  topFiveSection: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  topFiveSectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
  },
  topFiveList: {
    gap: 12,
  },
  topFiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserHighlight: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderWidth: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rankBadgeContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  rankBadgeFourth: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  rankBadgeFifth: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  rankBadgeSixth: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  rankBadgeSeventh: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  rankBadgeEighth: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderWidth: 2,
    borderColor: '#9B59B6',
  },
  rankBadgeNumber: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '800',
  },
  youBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  topFiveAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  topFiveAvatarImage: {
    width: 50,
    height: 50,
  },
  topFiveAvatarInitial: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  topFiveUserInfo: {
    flex: 1,
  },
  topFiveName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
    fontWeight: '600',
  },
  currentUserName: {
    color: '#FFD700',
    fontWeight: '700',
  },
  topFiveUsername: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  topFivePointsContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  topFivePoints: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  currentUserPoints: {
    color: '#FFD700',
    fontSize: 20,
  },
  topFivePointsLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  achievementBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  achievementEmoji: {
    fontSize: 16,
  },
});