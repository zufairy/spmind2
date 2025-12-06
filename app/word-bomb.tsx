import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput, Image, ImageBackground, Alert, Modal, Platform, InputAccessoryView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Trophy, Users, Clock, Heart, Star, Copy, Check, X, ArrowLeft, Play, Bomb, Zap, ChevronLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { wordBombService, WordBombGame, WordBombPlayer } from '../services/wordBombService';
import { validateWordSubmission } from '../data/wordList';
import { loadWordlistFromAssets } from '../data/loadWordlist';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

type GameMode = 'menu' | 'create' | 'join' | 'lobby' | 'playing' | 'finished';

export default function WordBombScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [game, setGame] = useState<WordBombGame | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showGetReady, setShowGetReady] = useState(false);
  const [wordlistLoaded, setWordlistLoaded] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastLettersRef = useRef<string>('');

  // Get current player
  const currentPlayer = game?.players.find(p => p.id === user?.id);
  const isMyTurn = game?.currentPlayerId === user?.id;
  const winner = game?.players.find(p => p.id === game.winnerId) || 
                 game?.players.sort((a, b) => b.score - a.score)[0];

  // Lazy load wordlist only when needed (when game starts)
  const ensureWordlistLoaded = async () => {
    if (wordlistLoaded) {
      return; // Already loaded
    }
    
    const loaded = await loadWordlistFromAssets();
    if (loaded) {
      console.log('✅ Wordlist loaded for Word Bomb');
      setWordlistLoaded(true);
    } else {
      console.log('ℹ️ Using built-in dictionary for Word Bomb');
      setWordlistLoaded(true); // Mark as "loaded" even if using fallback
    }
  };

  // Subscribe to game updates and poll for changes
  useEffect(() => {
    if (!gameId) return;

    // Handle game update function
    const handleUpdate = (updatedGame: WordBombGame) => {
      console.log('🔄 Update - State:', updatedGame.gameState, 'Countdown:', updatedGame.countdown, 'Letters:', updatedGame.currentLetters, 'Lives:', updatedGame.players[0]?.lives);
      
      // Check if letters changed
      if (updatedGame.currentLetters && updatedGame.currentLetters !== lastLettersRef.current) {
        console.log('✨ NEW LETTERS:', lastLettersRef.current, '→', updatedGame.currentLetters);
        lastLettersRef.current = updatedGame.currentLetters;
        setTimeLeft(15);
      }
      
      setGame(updatedGame);

      // Clear word input when turn changes
      if (updatedGame.currentPlayerId !== user?.id) {
        setWordInput('');
      }

      // Update game mode based on game state
      if (updatedGame.gameState === 'countdown' && gameMode === 'lobby') {
        // Stay in lobby mode but countdown will show
      } else if (updatedGame.gameState === 'playing' && gameMode !== 'playing') {
        setGameMode('playing');
      } else if (updatedGame.gameState === 'finished') {
        setGameMode('finished');
      }
    };

    // Real-time subscription
    const channel = wordBombService.subscribeToGame(gameId, (updatedGame) => {
      console.log('🎮 Real-time update');
      handleUpdate(updatedGame);
    });

    // Initial load
    const loadGame = async () => {
      const g = await wordBombService.getGame(gameId);
      if (g) {
        console.log('📥 Loaded:', g.currentLetters || 'No letters yet');
        handleUpdate(g);
      }
    };
    loadGame();

    // Poll every 1 second (reliable backup)
    const pollInterval = setInterval(async () => {
      const freshGame = await wordBombService.getGame(gameId);
      if (freshGame) {
        handleUpdate(freshGame);
      }
    }, 1000);

    return () => {
      wordBombService.unsubscribeFromGame(gameId);
      clearInterval(pollInterval);
    };
  }, [gameId]);

  // Timer countdown - simple and reliable
  useEffect(() => {
    if (gameMode !== 'playing' || timeLeft <= 0 || !game?.currentLetters) {
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        console.log('⏱️ Tick:', newTime);
        
        if (newTime === 0 && (isMyTurn || (game && game.players.length === 1))) {
          console.log('⏰ Time up!');
          handleTimeout();
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameMode, game?.currentLetters, isMyTurn]);

  // Debug: Log when letters change
  useEffect(() => {
    if (game?.currentLetters) {
      console.log('🔤 Letters changed to:', game.currentLetters);
    }
  }, [game?.currentLetters]);

  // Debug: Log when lives change
  useEffect(() => {
    if (currentPlayer) {
      console.log('💝 My lives:', currentPlayer.lives);
    }
  }, [currentPlayer?.lives]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameId && user) {
        wordBombService.leaveGame(gameId, user.id);
      }
    };
  }, [gameId, user]);

  const handleCreateGame = async () => {
    if (!user) {
      showFeedback('Please log in to create a game', 'error');
      return;
    }

    // Load wordlist before creating game (lazy loading)
    showFeedback('Loading word dictionary...', 'info');
    await ensureWordlistLoaded();

    const newGameId = await wordBombService.createGame(user.id, user.full_name || 'Player', 4);
    if (newGameId) {
      setGameId(newGameId);
      setIsHost(true);
      setGameMode('lobby');
      showFeedback('Game created! Share the room code with friends', 'success');
    } else {
      showFeedback('Failed to create game', 'error');
    }
  };

  const handleJoinGame = async () => {
    if (!user) {
      showFeedback('Please log in to join a game', 'error');
      return;
    }

    if (!roomCodeInput.trim()) {
      showFeedback('Please enter a room code', 'error');
      return;
    }

    // Load wordlist before joining game (lazy loading)
    showFeedback('Loading word dictionary...', 'info');
    await ensureWordlistLoaded();

    const joinedGameId = await wordBombService.joinGame(
      roomCodeInput.toUpperCase(),
      user.id,
      user.full_name || 'Player'
    );

    if (joinedGameId) {
      setGameId(joinedGameId);
      setIsHost(false);
      setGameMode('lobby');
      showFeedback('Joined game!', 'success');
    } else {
      showFeedback('Failed to join game. Check room code and try again.', 'error');
    }
  };

  const handleStartGame = async () => {
    if (!gameId || !isHost) return;

    if (!game || game.players.length < 1) {
      showFeedback('Need at least 1 player to start', 'error');
      return;
    }

    // Start countdown in database (this will sync to all players)
    const success = await wordBombService.startCountdown(gameId);
    if (!success) {
      showFeedback('Failed to start countdown', 'error');
      return;
    }

    // Update countdown every second
    let currentCountdown = 5;
    const countdownInterval = setInterval(async () => {
      currentCountdown--;
      
      if (currentCountdown > 0) {
        await wordBombService.updateCountdown(gameId, currentCountdown);
      } else {
        clearInterval(countdownInterval);
        // Show "Get Ready" screen for 2 seconds
        setShowGetReady(true);
        setTimeout(async () => {
          // Start the actual game
          const gameStarted = await wordBombService.startGame(gameId);
          if (gameStarted) {
            if (game.players.length === 1) {
              showFeedback('Practice Mode - Game started!', 'success');
            } else {
              showFeedback('Game started!', 'success');
            }
          } else {
            showFeedback('Failed to start game', 'error');
          }
          setShowGetReady(false);
        }, 2000); // 2 second delay
      }
    }, 1000);
  };

  const handleSubmitWord = async () => {
    if (!gameId || !user || !game || !isMyTurn) return;

    const word = wordInput.trim();
    if (!word) {
      showFeedback('Please enter a word', 'error');
      return;
    }

    console.log('📝 Submitting word:', word, 'for letters:', game.currentLetters);

    // Validate word locally first
    const validation = validateWordSubmission(word, game.currentLetters, game.usedWords);
    if (!validation.valid) {
      showFeedback(validation.message, 'error');
      setWordInput('');
      return;
    }

    const result = await wordBombService.submitWord(gameId, user.id, word);
    console.log('📤 Result:', result);
    
    if (result.success) {
      showFeedback(result.message + ' ✅', 'success');
      setWordInput('');
      // Polling will pick up new letters
    } else {
      showFeedback(result.message, 'error');
      setWordInput('');
    }
  };

  const handleTimeout = async () => {
    if (!gameId || !user) return;

    console.log('⏰ Handling timeout');
    await wordBombService.handleTimeout(gameId, user.id);
    showFeedback('Time\'s up! You lost a life 💔', 'error');
    setWordInput('');
    
    // Polling will pick up the changes
  };

  const handleLeaveGame = async () => {
    if (!gameId || !user) return;

    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await wordBombService.leaveGame(gameId, user.id);
            setGameId(null);
            setGame(null);
            setGameMode('menu');
          }
        }
      ]
    );
  };

  const handleCopyRoomCode = async () => {
    if (!game) return;
    
    await Clipboard.setStringAsync(game.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showFeedback('Room code copied!', 'success');
  };

  const handleBackToMenu = () => {
    if (gameId && user) {
      wordBombService.leaveGame(gameId, user.id);
    }
    setGameId(null);
    setGame(null);
    setGameMode('menu');
  };

  const handleBackPress = () => {
    // If in menu or finished, just go back
    if (gameMode === 'menu' || gameMode === 'finished') {
      router.back();
      return;
    }

    // If in lobby, join, or playing - show confirmation
    if (gameMode === 'lobby' || gameMode === 'join' || gameMode === 'playing') {
      Alert.alert(
        'Leave Game?',
        gameMode === 'playing' 
          ? 'You are currently in a game. Leaving will count as a loss. Are you sure?'
          : 'Are you sure you want to leave?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              if (gameId && user) {
                await wordBombService.leaveGame(gameId, user.id);
              }
              router.back();
            }
          }
        ]
      );
      return;
    }

    // Default: just go back
    router.back();
  };

  const handlePlayAgain = async () => {
    handleBackToMenu();
    await handleCreateGame();
  };

  const showFeedback = (message: string, type: 'success' | 'error' | 'info') => {
    setFeedback({ message, type });
    
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  // Dynamic styles
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    text: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
  };

  // Render Menu Screen
  const renderMenu = () => (
    <Animatable.View animation="fadeIn" style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <Animatable.View 
          animation="bounce" 
          iterationCount="infinite" 
          duration={2000}
          style={styles.bombIconContainer}
        >
          <Bomb size={80} color="#FF4444" fill="#FF6B6B" />
        </Animatable.View>
        <Text style={[styles.menuTitle, dynamicStyles.text]}>Word Bomb</Text>
        <Text style={[styles.menuSubtitle, dynamicStyles.text]}>
          Type words before the bomb explodes!
        </Text>
      </View>

      <View style={styles.menuButtons}>
        <TouchableOpacity style={styles.menuButton} onPress={handleCreateGame}>
          <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.menuButtonGradient}>
            <Users size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Create Game</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => setGameMode('join')}>
          <LinearGradient colors={['#2196F3', '#1565C0']} style={styles.menuButtonGradient}>
            <Play size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Join Game</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.howToPlay}>
        <Text style={[styles.howToPlayTitle, dynamicStyles.text]}>How to Play:</Text>
        <Text style={[styles.howToPlayText, dynamicStyles.text]}>
          • Type a word containing the shown letters{'\n'}
          • You have 15 seconds per turn{'\n'}
          • Lose a life if time runs out{'\n'}
          • Last player standing wins!
        </Text>
      </View>
    </Animatable.View>
  );

  // Render Join Screen
  const renderJoin = () => (
    <Animatable.View animation="fadeIn" style={styles.joinContainer}>
      <Text style={[styles.joinTitle, dynamicStyles.text]}>Join Game</Text>
      <Text style={[styles.joinSubtitle, dynamicStyles.text]}>
        Enter the room code shared by your friend
      </Text>

      <View style={styles.joinInputContainer}>
        <TextInput
          style={styles.joinInput}
          placeholder="Room Code (e.g., ABC123)"
          placeholderTextColor="#999"
          value={roomCodeInput}
          onChangeText={setRoomCodeInput}
          autoCapitalize="characters"
          maxLength={6}
        />
      </View>

      <View style={styles.joinButtons}>
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinGame}>
          <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.joinButtonGradient}>
            <Text style={styles.joinButtonText}>Join</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => setGameMode('menu')}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  // Render Lobby Screen
  const renderLobby = () => (
    <Animatable.View animation="fadeIn" style={styles.lobbyContainer}>
      <View style={styles.lobbyHeader}>
        <View style={styles.lobbyTitleContainer}>
          <Text style={[styles.lobbyTitle, dynamicStyles.text]}>
            {game && game.players.length === 1 ? 'Practice Mode' : 'Game Lobby'}
          </Text>
        </View>
        <TouchableOpacity style={styles.roomCodeButton} onPress={handleCopyRoomCode}>
          <Text style={styles.roomCodeLabel}>Room Code:</Text>
          <View style={styles.roomCodeValue}>
            <Text style={styles.roomCodeText}>{game?.roomCode}</Text>
            {copiedCode ? (
              <Check size={16} color="#4CAF50" />
            ) : (
              <Copy size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.playersContainer}>
        <Text style={[styles.playersTitle, dynamicStyles.text]}>
          Players ({game?.players.length}/{game?.maxPlayers})
        </Text>
        <ScrollView style={styles.playersList}>
          {game?.players.map((player, index) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerLeft}>
                {player.avatarUrl ? (
                  <Image 
                    source={{ uri: player.avatarUrl }} 
                    style={styles.playerAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.playerAvatarFallback}>
                    <Text style={styles.playerAvatarText}>{player.avatar}</Text>
                  </View>
                )}
                <View>
                  <Text style={[styles.playerName, dynamicStyles.text]}>
                    {player.name}
                    {player.id === game.hostId && ' 👑'}
                  </Text>
                  <Text style={styles.playerStatus}>Ready</Text>
                </View>
              </View>
              <View style={styles.playerLives}>
                {[...Array(2)].map((_, i) => (
                  <Heart key={i} size={16} color="#FF4444" fill="#FF4444" />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.lobbyActions}>
        {game?.gameState === 'countdown' && game.countdown > 0 ? (
          <View style={styles.countdownContainer}>
            <Animatable.Text 
              animation="pulse" 
              iterationCount="infinite" 
              duration={500}
              style={styles.countdownText}
            >
              {game.countdown}
            </Animatable.Text>
            <Text style={[styles.countdownLabel, dynamicStyles.text]}>Game starting...</Text>
          </View>
        ) : isHost ? (
          <>
            <TouchableOpacity 
              style={[styles.startButton, game && game.players.length < 1 && styles.startButtonDisabled]} 
              onPress={handleStartGame}
              disabled={!game || game.players.length < 1}
            >
              <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.startButtonGradient}>
                <Play size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>
                  {game && game.players.length === 1 ? 'Start Practice' : 'Start Game'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {game && game.players.length === 1 && game.gameState !== 'countdown' && (
              <Text style={[styles.practiceHint, dynamicStyles.text]}>
                💡 Playing solo? Perfect for practice! Share the room code to invite friends.
              </Text>
            )}
          </>
        ) : (
          <View style={styles.waitingContainer}>
            <Animatable.View animation="pulse" iterationCount="infinite" duration={1500}>
              <Clock size={32} color="#2196F3" />
            </Animatable.View>
            <Text style={[styles.waitingText, dynamicStyles.text]}>Waiting for host to start...</Text>
          </View>
        )}

        {game?.gameState !== 'countdown' && (
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGame}>
            <X size={20} color="#FF4444" />
            <Text style={styles.leaveButtonText}>Leave Game</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animatable.View>
  );

  // Render Playing Screen
  const renderPlaying = () => {
    // Calculate player positions in circle around bomb
    // Slot 0 = Top, Slot 1 = Right, Slot 2 = Bottom, Slot 3 = Left
    const getPlayerPosition = (index: number) => {
      const containerSize = 400;
      const centerX = containerSize / 2; // 200
      const centerY = containerSize / 2; // 200
      const radius = 160; // Distance from center to player
      
      // Start from top (-90 degrees) and go clockwise
      const angle = (index * 2 * Math.PI) / 4 - Math.PI / 2;
      
      // Calculate position relative to container center
      const x = centerX + Math.cos(angle) * radius - 40; // -40 to center the 80px card
      const y = centerY + Math.sin(angle) * radius - 40; // -40 to center the 80px card
      
      console.log(`Slot ${index}: left=${x.toFixed(0)}, top=${y.toFixed(0)}, center at: ${(x+40).toFixed(0)}, ${(y+40).toFixed(0)}, angle=${(angle * 180 / Math.PI).toFixed(0)}°`);
      return { left: x, top: y, angle };
    };

    return (
      <Animatable.View animation="fadeIn" style={styles.playingContainer}>
        {/* Get Ready Overlay */}
        {showGetReady && (
          <View style={styles.getReadyOverlay}>
            <Animatable.View animation="zoomIn" style={styles.getReadyContainer}>
              <Animatable.Text
                animation="pulse"
                iterationCount="infinite"
                duration={1000}
                style={styles.getReadyText}
              >
                Get Ready!
              </Animatable.Text>
              <Text style={styles.getReadySubtext}>The game is about to begin...</Text>
            </Animatable.View>
          </View>
        )}

        {/* Round info at top */}
        <View style={styles.topRoundContainer}>
          <Text style={[styles.roundText, dynamicStyles.text]}>
            {game && game.players.length === 1 ? '🎯 Practice Mode' : `Round ${game?.roundNumber}`}
          </Text>
        </View>

        {/* Central Game Area with Bomb and Players */}
        <View style={styles.centralGameArea}>

          {/* Players positioned around the bomb - Always show 4 slots */}
          <View style={styles.playersCircle}>
            {[0, 1, 2, 3].map((slotIndex) => {
              const position = getPlayerPosition(slotIndex); // Always 4 positions
              const player = game?.players[slotIndex];
              const isCurrentPlayer = player && player.id === game.currentPlayerId;
              
              return (
                <View
                  key={`slot-${slotIndex}`}
                  style={[
                    styles.circularPlayerCard,
                    {
                      left: position.left,
                      top: position.top,
                    }
                  ]}
                >
                <Animatable.View
                  animation={isCurrentPlayer ? 'pulse' : undefined}
                  iterationCount="infinite"
                  duration={1500}
                  style={[
                    player && !player.isAlive && styles.playerEliminated,
                    isCurrentPlayer && styles.playerActive
                  ]}
                >
                  {/* Arrow pointing to current player */}
                  {isCurrentPlayer && (
                    <View style={styles.turnArrowContainer}>
                      <Animatable.View
                        animation="bounce"
                        iterationCount="infinite"
                        duration={1000}
                        style={[styles.turnArrow, {
                          transform: [
                            // Arrow points inward toward player: angle + 180° (opposite direction), minus 90° (since ▼ is 90°)
                            { rotate: `${(position.angle * 180) / Math.PI + 90}deg` }
                          ]
                        }]}
                      >
                        <Text style={styles.turnArrowText}>▼</Text>
                      </Animatable.View>
                    </View>
                  )}
                  
                  {/* Player avatar or placeholder */}
                  <View style={[
                    styles.playerCircleAvatar,
                    !player && styles.placeholderAvatar,
                    isCurrentPlayer && styles.activePlayerAvatar
                  ]}>
                    {player ? (
                      player.avatarUrl ? (
                        <Image 
                          source={{ uri: player.avatarUrl }} 
                          style={styles.circularPlayerAvatarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.circularPlayerEmoji}>
                          {player.avatar}
                        </Text>
                      )
                    ) : (
                      <Text style={styles.circularPlayerEmoji}>?</Text>
                    )}
                  </View>
                  
                  {player && (
                    <>
                      <Text style={[styles.circularPlayerName, dynamicStyles.text]} numberOfLines={1}>
                        {player.name}
                      </Text>
                      <View style={styles.circularPlayerLives}>
                        <Heart 
                          size={12} 
                          color={player.lives >= 1 ? '#FF4444' : '#444'} 
                          fill={player.lives >= 1 ? '#FF4444' : 'transparent'} 
                        />
                        <Heart 
                          size={12} 
                          color={player.lives >= 2 ? '#FF4444' : '#444'} 
                          fill={player.lives >= 2 ? '#FF4444' : 'transparent'} 
                        />
                      </View>
                    </>
                  )}
                </Animatable.View>
                </View>
              );
            })}

            {/* Central Bomb with Timer on Top and Text Below - Inside playersCircle */}
            <View style={styles.centralBomb}>
            {/* Timer - Above bomb */}
            <View style={styles.timerAboveBomb}>
              <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerUrgent]}>
                <Animatable.View 
                  animation={timeLeft <= 5 ? 'pulse' : undefined}
                  iterationCount="infinite"
                  duration={500}
                >
                  <Clock size={14} color={timeLeft <= 5 ? '#FF4444' : '#FFFFFF'} />
                </Animatable.View>
                <Text style={[styles.timerText, { color: timeLeft <= 5 ? '#FF4444' : '#FFFFFF' }]}>
                  {timeLeft}s
                </Text>
              </View>
            </View>

            {/* Bomb */}
            <Animatable.View 
              animation={isMyTurn || (game && game.players.length === 1) ? 'tada' : 'pulse'}
              iterationCount="infinite"
              duration={isMyTurn || (game && game.players.length === 1) ? 600 : 2000}
              style={styles.bombWrapper}
            >
              <LinearGradient
                colors={
                  isMyTurn || (game && game.players.length === 1)
                    ? ['#FF4444', '#CC0000', '#FF6B6B'] 
                    : ['#666', '#333', '#555']
                }
                style={styles.bombGradientCenter}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Animatable.View
                  animation={timeLeft <= 5 ? 'shake' : undefined}
                  iterationCount="infinite"
                  duration={200}
                >
                  <Bomb size={30} color="#FFFFFF" />
                </Animatable.View>
              </LinearGradient>
            </Animatable.View>

            {/* Letter Display - Below bomb, smaller */}
            <View style={styles.lettersDisplay}>
              {game?.currentLetters && game.currentLetters.length > 0 ? (
                <View style={styles.letterBoxesRow}>
                  {game.currentLetters.split('').map((letter, index) => (
                    <Animatable.View 
                      key={`${letter}-${index}-${game.roundNumber}-${game.currentLetters}`}
                      animation="bounceIn"
                      duration={500}
                      delay={index * 100}
                      style={styles.letterBoxSmall}
                    >
                      <Text style={styles.letterBoxTextSmall}>{letter}</Text>
                    </Animatable.View>
                  ))}
                </View>
              ) : (
                <View style={styles.letterBoxSmall}>
                  <Text style={styles.letterBoxTextSmall}>?</Text>
                </View>
              )}
            </View>

            {/* Turn indicator - Below letters */}
            {game && game.players.length > 1 && (
              <View style={styles.turnIndicatorBelow}>
                {isMyTurn ? (
                  <Text style={[styles.turnTextBelow, { color: '#FFD700' }]}>YOUR TURN!</Text>
                ) : (
                  <Text style={[styles.turnTextBelow, dynamicStyles.text]}>
                    {game?.players.find(p => p.id === game.currentPlayerId)?.name}'s turn
                  </Text>
                )}
              </View>
            )}
          </View>
          </View>
        </View>

        {/* Word Input at bottom */}
        {(isMyTurn || (game && game.players.length === 1)) && (
          <View style={styles.bottomInputContainer}>
            <TextInput
              key={`input-${game?.currentLetters}-${game?.roundNumber}`}
              style={styles.wordInput}
              placeholder={game?.currentLetters ? `Type a word with "${game.currentLetters}"...` : 'Type your word...'}
              placeholderTextColor="#999"
              value={wordInput}
              onChangeText={setWordInput}
              onSubmitEditing={handleSubmitWord}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="send"
              editable={isMyTurn || (game && game.players.length === 1)}
              inputAccessoryViewID="wordInputAccessory"
            />
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmitWord}
              disabled={!isMyTurn && game && game.players.length > 1}
            >
              <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.submitButtonGradient}>
                <Zap size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Animatable.View>
    );
  };

  // Render Finished Screen
  const renderFinished = () => (
    <Animatable.View animation="fadeIn" style={styles.finishedContainer}>
      <Animatable.View animation="bounceIn" duration={1000} style={styles.winnerContainer}>
        <Trophy size={80} color="#FFD700" fill="#FFD700" />
        <Text style={[styles.winnerTitle, dynamicStyles.text]}>
          {game?.players.length === 1 && !winner ? 'Game Over!' : `${winner?.name || 'Unknown Player'} Wins!`}
        </Text>
        {winner?.avatarUrl ? (
          <Image 
            source={{ uri: winner.avatarUrl }} 
            style={styles.winnerAvatarImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.winnerAvatar}>{winner?.avatar}</Text>
        )}
      </Animatable.View>

      <View style={styles.statsContainer}>
        <Text style={[styles.statsTitle, dynamicStyles.text]}>Final Scores</Text>
        <ScrollView style={styles.statsList}>
          {game?.players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <View key={player.id} style={styles.statCard}>
                <View style={styles.statLeft}>
                  <Text style={styles.statRank}>#{index + 1}</Text>
                  {player.avatarUrl ? (
                    <Image 
                      source={{ uri: player.avatarUrl }} 
                      style={styles.statAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.statAvatar}>{player.avatar}</Text>
                  )}
                  <Text style={[styles.statName, dynamicStyles.text]}>{player.name}</Text>
                </View>
                <View style={styles.statRight}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={[styles.statScore, dynamicStyles.text]}>{player.score}</Text>
                </View>
              </View>
            ))}
        </ScrollView>
      </View>

      <View style={styles.finishedActions}>
        <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
          <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.playAgainButtonGradient}>
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton2} onPress={handleBackToMenu}>
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.menuButtonText2}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ImageBackground 
        source={require('../assets/images/wall.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(20, 20, 20, 0.95)', 'rgba(30, 30, 30, 0.9)', 'rgba(25, 25, 25, 0.92)']}
          style={styles.gradient}
        >
          {/* Back Button - Hide in lobby */}
          {gameMode !== 'lobby' && (
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                <ChevronLeft size={22} color="#FFFFFF" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feedback Toast */}
          {feedback && (
            <Animatable.View 
              animation="fadeInDown" 
              style={[
                styles.feedbackToast,
                feedback.type === 'success' && styles.feedbackSuccess,
                feedback.type === 'error' && styles.feedbackError,
                feedback.type === 'info' && styles.feedbackInfo
              ]}
            >
              <Text style={styles.feedbackText}>{feedback.message}</Text>
            </Animatable.View>
          )}

          {/* Main Content */}
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={[
              styles.contentContainer,
              gameMode !== 'lobby' && styles.contentWithHeader
            ]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={gameMode === 'menu'}
          >
            {gameMode === 'menu' && renderMenu()}
            {gameMode === 'join' && renderJoin()}
            {gameMode === 'lobby' && renderLobby()}
            {gameMode === 'playing' && renderPlaying()}
            {gameMode === 'finished' && renderFinished()}
          </ScrollView>
        </LinearGradient>
      </ImageBackground>

      {/* Keyboard Accessory View for iOS */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="wordInputAccessory">
          <View style={styles.keyboardAccessory}>
            <View style={styles.typingDisplayAccessory}>
              <Text style={styles.typingLabelAccessory}>Your Word:</Text>
              <Text style={styles.typingTextAccessory}>
                {wordInput || '_'}
              </Text>
            </View>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  contentWithHeader: {
    paddingTop: 0,
  },

  // Header Bar with Back Button
  headerBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 15,
    left: 20,
    zIndex: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Feedback Toast
  feedbackToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 80,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  feedbackSuccess: {
    backgroundColor: '#4CAF50',
  },
  feedbackError: {
    backgroundColor: '#FF4444',
  },
  feedbackInfo: {
    backgroundColor: '#2196F3',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Menu Screen
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  bombIconContainer: {
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  menuButtons: {
    width: '100%',
    gap: 15,
    marginBottom: 40,
  },
  menuButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  menuButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
  howToPlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  howToPlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  howToPlayText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },

  // Join Screen
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  joinSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 30,
    textAlign: 'center',
  },
  joinInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  joinInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  joinButtons: {
    width: '100%',
    gap: 10,
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },

  // Lobby Screen
  lobbyContainer: {
    flex: 1,
    paddingTop: 20,
  },
  getReadyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  getReadyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  getReadyText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  getReadySubtext: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  lobbyHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  lobbyTitleContainer: {
    paddingTop: 10,
    marginBottom: 15,
  },
  lobbyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  roomCodeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roomCodeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  roomCodeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomCodeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  playersContainer: {
    flex: 1,
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  playersList: {
    flex: 1,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerAvatar: {
    fontSize: 32,
  },
  playerAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  playerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  playerStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  playerLives: {
    flexDirection: 'row',
    gap: 4,
  },
  lobbyActions: {
    gap: 10,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingContainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 16,
    opacity: 0.8,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  leaveButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  practiceHint: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  countdownLabel: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },

  // Playing Screen - Circular Layout
  playingContainer: {
    flex: 1,
    paddingTop: 20,
  },
  topRoundContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  roundText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  centralGameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 10,
    marginTop: -20,
  },
  lettersDisplay: {
    marginTop: 8,
    alignItems: 'center',
  },
  letterBoxesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  letterBoxSmall: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 6,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  letterBoxTextSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  lettersLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  playersCircle: {
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularPlayerCard: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    width: 80,
  },
  turnArrowContainer: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnArrow: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnArrowText: {
    fontSize: 28,
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playerCircleAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placeholderAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activePlayerAvatar: {
    borderColor: '#FFD700',
    borderWidth: 4,
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
  },
  circularPlayerEmoji: {
    fontSize: 32,
  },
  circularPlayerAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  circularPlayerName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    maxWidth: 70,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  circularPlayerLives: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerActive: {
    transform: [{ scale: 1.1 }],
  },
  playerEliminated: {
    opacity: 0.3,
  },
  centralBomb: {
    position: 'absolute',
    width: 120, // Fixed width for consistent centering
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 5,
    left: 140, // 200 (center) - 60 (half of 120px) = 140 to center horizontally
    top: 134, // Calculated to center bomb circle at y=200: 200 - 30 (radius) - 8 (margin) - 28 (timer) = 134
  },
  bombWrapper: {
    alignItems: 'center',
    width: 60,
  },
  bombGradientCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerAboveBomb: {
    marginBottom: 8,
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  timerUrgent: {
    backgroundColor: 'rgba(255, 68, 68, 0.5)',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  turnIndicatorBelow: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  turnTextBelow: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Keyboard Accessory (iOS)
  keyboardAccessory: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  typingDisplayAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  typingLabelAccessory: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  typingTextAccessory: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    minWidth: 80,
    textAlign: 'center',
    letterSpacing: 2,
  },
  bottomInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  wordInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Finished Screen
  finishedContainer: {
    flex: 1,
    paddingTop: 40,
  },
  winnerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  winnerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 15,
  },
  winnerAvatar: {
    fontSize: 64,
  },
  winnerAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  statsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsList: {
    flex: 1,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    width: 30,
  },
  statAvatar: {
    fontSize: 28,
  },
  statAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  statName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  finishedActions: {
    gap: 10,
  },
  playAgainButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  playAgainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  playAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  menuButtonText2: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
});

