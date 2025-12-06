import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated as RNAnimated,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { X, Sparkles, RotateCcw, Maximize2 } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Rect, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function CropQuestionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  
  // Animated values for smooth image manipulation
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  
  // Crop container dimensions - adjustable
  const initialWidthPct = 0.8;
  const initialAspect = 4/1;
  const initialCropWidth = width * initialWidthPct;
  const initialCropHeight = initialCropWidth / initialAspect;
  const initialCropX = (width - initialCropWidth) / 2;
  const initialCropY = (height - initialCropHeight) / 2 - 120;
  
  const cropWidth = useSharedValue(initialCropWidth);
  const cropHeight = useSharedValue(initialCropHeight);
  const cropX = useSharedValue(initialCropX);
  const cropY = useSharedValue(initialCropY);
  const savedCropWidth = useSharedValue(initialCropWidth);
  const savedCropHeight = useSharedValue(initialCropHeight);
  const savedCropX = useSharedValue(initialCropX);
  const savedCropY = useSharedValue(initialCropY);
  
  const cornerRadius = 20;

  useEffect(() => {
    if (params.imageUri) {
      const uri = params.imageUri as string;
      setImageUri(uri);
      
      // Get image dimensions
      Image.getSize(uri, (w, h) => {
        setImageDimensions({ width: w, height: h });
      });
    }
    
    // Fade in animation
    RNAnimated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [params.imageUri]);

  // Pan gesture for dragging the image
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(savedScale.value * event.scale, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Resize gestures for crop container
  // Bottom-right corner resize
  const resizeBottomRight = Gesture.Pan()
    .onUpdate((event) => {
      const newWidth = savedCropWidth.value + event.translationX;
      const newHeight = savedCropHeight.value + event.translationY;
      cropWidth.value = Math.max(200, Math.min(width - 40, newWidth));
      cropHeight.value = Math.max(100, Math.min(height - 200, newHeight));
    })
    .onEnd(() => {
      savedCropWidth.value = cropWidth.value;
      savedCropHeight.value = cropHeight.value;
      // Recalculate cropX to keep centered
      cropX.value = (width - cropWidth.value) / 2;
      savedCropX.value = cropX.value;
    });

  // Top-left corner resize
  const resizeTopLeft = Gesture.Pan()
    .onUpdate((event) => {
      const newWidth = savedCropWidth.value - event.translationX;
      const newHeight = savedCropHeight.value - event.translationY;
      const newX = savedCropX.value + event.translationX;
      const newY = savedCropY.value + event.translationY;
      
      if (newWidth >= 200 && newWidth <= width - 40) {
        cropWidth.value = newWidth;
        cropX.value = newX;
      }
      if (newHeight >= 100 && newHeight <= height - 200) {
        cropHeight.value = newHeight;
        cropY.value = newY;
      }
    })
    .onEnd(() => {
      savedCropWidth.value = cropWidth.value;
      savedCropHeight.value = cropHeight.value;
      savedCropX.value = cropX.value;
      savedCropY.value = cropY.value;
    });

  // Top-right corner resize
  const resizeTopRight = Gesture.Pan()
    .onUpdate((event) => {
      const newWidth = savedCropWidth.value + event.translationX;
      const newHeight = savedCropHeight.value - event.translationY;
      const newY = savedCropY.value + event.translationY;
      
      if (newWidth >= 200 && newWidth <= width - 40) {
        cropWidth.value = newWidth;
      }
      if (newHeight >= 100 && newHeight <= height - 200) {
        cropHeight.value = newHeight;
        cropY.value = newY;
      }
    })
    .onEnd(() => {
      savedCropWidth.value = cropWidth.value;
      savedCropHeight.value = cropHeight.value;
      savedCropY.value = cropY.value;
      // Recalculate cropX to keep centered
      cropX.value = (width - cropWidth.value) / 2;
      savedCropX.value = cropX.value;
    });

  // Bottom-left corner resize
  const resizeBottomLeft = Gesture.Pan()
    .onUpdate((event) => {
      const newWidth = savedCropWidth.value - event.translationX;
      const newHeight = savedCropHeight.value + event.translationY;
      const newX = savedCropX.value + event.translationX;
      
      if (newWidth >= 200 && newWidth <= width - 40) {
        cropWidth.value = newWidth;
        cropX.value = newX;
      }
      if (newHeight >= 100 && newHeight <= height - 200) {
        cropHeight.value = newHeight;
      }
    })
    .onEnd(() => {
      savedCropWidth.value = cropWidth.value;
      savedCropHeight.value = cropHeight.value;
      savedCropX.value = cropX.value;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Animated styles for blur overlays
  const topOverlayStyle = useAnimatedStyle(() => {
    return {
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(0, cropY.value),
    };
  });

  const bottomOverlayStyle = useAnimatedStyle(() => {
    return {
      top: cropY.value + cropHeight.value,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    return {
      top: cropY.value,
      left: 0,
      width: Math.max(0, cropX.value),
      height: cropHeight.value,
    };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    return {
      top: cropY.value,
      right: 0,
      width: Math.max(0, width - cropX.value - cropWidth.value),
      height: cropHeight.value,
    };
  });

  const handleSolveIt = async () => {
    if (!imageUri) return;
    
    setIsProcessing(true);
    
    // Scale button animation
    RNAnimated.sequence([
      RNAnimated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      // Get current crop values
      const currentCropX = cropX.value;
      const currentCropY = cropY.value;
      const currentCropWidth = cropWidth.value;
      const currentCropHeight = cropHeight.value;
      
      // Calculate crop coordinates
      const screenCenterX = width / 2;
      const screenCenterY = height / 2;
      
      // Crop frame position
      const cropFrameLeft = currentCropX;
      const cropFrameTop = currentCropY;
      
      // Calculate how the image is displayed with resizeMode="contain"
      const imageAspect = imageDimensions.width / imageDimensions.height;
      const containerAspect = width / height;
      
      let baseDisplayWidth, baseDisplayHeight;
      if (imageAspect > containerAspect) {
        baseDisplayWidth = width;
        baseDisplayHeight = width / imageAspect;
      } else {
        baseDisplayHeight = height;
        baseDisplayWidth = height * imageAspect;
      }
      
      // Apply user's zoom and pan transformations
      const scaledDisplayWidth = baseDisplayWidth * scale.value;
      const scaledDisplayHeight = baseDisplayHeight * scale.value;
      
      // Image center after user transformations
      const imageCenterX = screenCenterX + translateX.value;
      const imageCenterY = screenCenterY + translateY.value;
      
      // Image bounds on screen
      const imageDisplayLeft = imageCenterX - (scaledDisplayWidth / 2);
      const imageDisplayTop = imageCenterY - (scaledDisplayHeight / 2);
      
      // Calculate what portion of the original image is in the crop frame
      const relCropLeft = cropFrameLeft - imageDisplayLeft;
      const relCropTop = cropFrameTop - imageDisplayTop;
      
      // Convert screen pixels to original image pixels
      const scaleFactorX = imageDimensions.width / scaledDisplayWidth;
      const scaleFactorY = imageDimensions.height / scaledDisplayHeight;
      
      const cropOriginX = relCropLeft * scaleFactorX;
      const cropOriginY = relCropTop * scaleFactorY;
      const cropPixelWidth = currentCropWidth * scaleFactorX;
      const cropPixelHeight = currentCropHeight * scaleFactorY;
      
      // Clamp to valid image bounds
      const finalX = Math.max(0, Math.min(cropOriginX, imageDimensions.width - 1));
      const finalY = Math.max(0, Math.min(cropOriginY, imageDimensions.height - 1));
      const finalW = Math.max(1, Math.min(cropPixelWidth, imageDimensions.width - finalX));
      const finalH = Math.max(1, Math.min(cropPixelHeight, imageDimensions.height - finalY));
      
      console.log('🎯 CROP INFO:', { 
        originX: Math.round(finalX), 
        originY: Math.round(finalY), 
        width: Math.round(finalW), 
        height: Math.round(finalH) 
      });
      
      // Perform actual crop
      const croppedImage = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(finalX),
              originY: Math.round(finalY),
              width: Math.round(finalW),
              height: Math.round(finalH),
            },
          },
        ],
        { compress: 0.95, format: SaveFormat.JPEG }
      );

      console.log('✅ Image cropped successfully!');

      // Navigate to homework helper with cropped image
      setTimeout(() => {
        router.push({
          pathname: '/homework-helper',
          params: {
            imageUri: croppedImage.uri,
            originalImageUri: imageUri,
          },
        });
      }, 150);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    RNAnimated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const handleReset = () => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    scale.value = withSpring(1);
    savedScale.value = 1;
    
    // Reset crop container
    cropWidth.value = withSpring(initialCropWidth);
    cropHeight.value = withSpring(initialCropHeight);
    cropX.value = withSpring(initialCropX);
    cropY.value = withSpring(initialCropY);
    savedCropWidth.value = initialCropWidth;
    savedCropHeight.value = initialCropHeight;
    savedCropX.value = initialCropX;
    savedCropY.value = initialCropY;
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <RNAnimated.View style={[styles.container, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.95)" />
        
        {/* Background */}
        <View style={styles.background} />

        {/* Close Button */}
        <Animatable.View animation="fadeInDown" delay={200} style={styles.closeButtonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={28} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animatable.View>

        {/* Reset Button */}
        <Animatable.View animation="fadeInDown" delay={300} style={styles.resetButtonContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <RotateCcw size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animatable.View>

        {/* Image with Gesture Controls */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.imageContainer}>
            {imageUri ? (
              <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </Animated.View>
            ) : (
              <ActivityIndicator size="large" color="#FFFFFF" />
            )}
          </Animated.View>
        </GestureDetector>

        {/* Blur Overlays - Dynamic */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Top blur overlay */}
          <Animated.View style={[styles.blurSection, topOverlayStyle]}>
            <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
              <View style={styles.darkOverlay} />
            </BlurView>
          </Animated.View>
          
          {/* Bottom blur overlay */}
          <Animated.View style={[styles.blurSection, bottomOverlayStyle]}>
            <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
              <View style={styles.darkOverlay} />
            </BlurView>
          </Animated.View>
          
          {/* Left blur overlay */}
          <Animated.View style={[styles.blurSection, leftOverlayStyle]}>
            <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
              <View style={styles.darkOverlay} />
            </BlurView>
          </Animated.View>
          
          {/* Right blur overlay */}
          <Animated.View style={[styles.blurSection, rightOverlayStyle]}>
            <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
              <View style={styles.darkOverlay} />
            </BlurView>
          </Animated.View>
        </View>

        {/* SVG Dashed Border - Dynamic */}
        <DynamicCropBorder 
          cropX={cropX}
          cropY={cropY}
          cropWidth={cropWidth}
          cropHeight={cropHeight}
          cornerRadius={cornerRadius}
        />

        {/* Resize Handles - Visible and Interactive */}
        <Animated.View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Top-left corner handle */}
          <GestureDetector gesture={resizeTopLeft}>
            <Animated.View 
              style={[
                styles.cornerHandle,
                useAnimatedStyle(() => ({
                  left: cropX.value - 15,
                  top: cropY.value - 15,
                }))
              ]}
              pointerEvents="auto"
            >
              <View style={styles.cornerHandleInner} />
              <Maximize2 size={14} color="#FFD700" style={styles.handleIcon} />
            </Animated.View>
          </GestureDetector>

          {/* Top-right corner handle */}
          <GestureDetector gesture={resizeTopRight}>
            <Animated.View 
              style={[
                styles.cornerHandle,
                useAnimatedStyle(() => ({
                  left: cropX.value + cropWidth.value - 15,
                  top: cropY.value - 15,
                }))
              ]}
              pointerEvents="auto"
            >
              <View style={styles.cornerHandleInner} />
              <Maximize2 size={14} color="#FFD700" style={styles.handleIcon} />
            </Animated.View>
          </GestureDetector>

          {/* Bottom-right corner handle */}
          <GestureDetector gesture={resizeBottomRight}>
            <Animated.View 
              style={[
                styles.cornerHandle,
                useAnimatedStyle(() => ({
                  left: cropX.value + cropWidth.value - 15,
                  top: cropY.value + cropHeight.value - 15,
                }))
              ]}
              pointerEvents="auto"
            >
              <View style={styles.cornerHandleInner} />
              <Maximize2 size={14} color="#FFD700" style={styles.handleIcon} />
            </Animated.View>
          </GestureDetector>

          {/* Bottom-left corner handle */}
          <GestureDetector gesture={resizeBottomLeft}>
            <Animated.View 
              style={[
                styles.cornerHandle,
                useAnimatedStyle(() => ({
                  left: cropX.value - 15,
                  top: cropY.value + cropHeight.value - 15,
                }))
              ]}
              pointerEvents="auto"
            >
              <View style={styles.cornerHandleInner} />
              <Maximize2 size={14} color="#FFD700" style={styles.handleIcon} />
            </Animated.View>
          </GestureDetector>
        </Animated.View>

        {/* Hint text */}
        <Animatable.View
          animation="fadeIn"
          delay={600}
          style={styles.hintContainer}
          pointerEvents="none"
        >
          <Text style={styles.hintText}>Pinch & drag image • Drag corners to resize box</Text>
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.actionButtonsContainer} pointerEvents="box-none">
          {/* Retake Button */}
          <TouchableOpacity 
            style={styles.retakeActionButton}
            onPress={handleClose}
            activeOpacity={0.8}
            pointerEvents="auto"
          >
            <RotateCcw size={22} color="#FFFFFF" />
            <Text style={styles.retakeActionText}>Retake</Text>
          </TouchableOpacity>

          {/* Analyze Button */}
          <TouchableOpacity 
            style={styles.analyzeButton}
            onPress={handleSolveIt}
            disabled={isProcessing}
            activeOpacity={0.85}
            pointerEvents="auto"
          >
            <RNAnimated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
              <LinearGradient
                colors={isProcessing ? ['#666666', '#444444'] : ['#FFD700', '#FFA500', '#FF8C00']}
                style={styles.analyzeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isProcessing ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Animatable.View
                      animation="pulse"
                      iterationCount="infinite"
                      duration={1500}
                    >
                      <Sparkles size={28} color="#FFFFFF" />
                    </Animatable.View>
                    <Text style={styles.analyzeButtonText}>Analyze</Text>
                  </View>
                )}
              </LinearGradient>
            </RNAnimated.View>
          </TouchableOpacity>
        </Animatable.View>
      </RNAnimated.View>
    </GestureHandlerRootView>
  );
}

// Dynamic Crop Border Component
function DynamicCropBorder({ cropX, cropY, cropWidth, cropHeight, cornerRadius }: any) {
  const [borderData, setBorderData] = useState({
    x: cropX.value,
    y: cropY.value,
    w: cropWidth.value,
    h: cropHeight.value,
  });

  // Update border on every frame
  useEffect(() => {
    const interval = setInterval(() => {
      setBorderData({
        x: cropX.value,
        y: cropY.value,
        w: cropWidth.value,
        h: cropHeight.value,
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [cropX, cropY, cropWidth, cropHeight]);

  const { x, y, w, h } = borderData;

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Dashed border with rounded corners */}
        <Rect 
          x={x} 
          y={y} 
          width={w} 
          height={h} 
          rx={cornerRadius}
          ry={cornerRadius}
          fill="transparent"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeDasharray="8 4"
          strokeLinecap="round"
        />
        
        {/* Corner indicators - Top Left */}
        <Path 
          d={`M ${x - 2} ${y + cornerRadius} L ${x - 2} ${y - 2} L ${x + cornerRadius} ${y - 2}`}
          stroke="#FFFFFF"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        {/* Corner indicators - Top Right */}
        <Path 
          d={`M ${x + w - cornerRadius} ${y - 2} L ${x + w + 2} ${y - 2} L ${x + w + 2} ${y + cornerRadius}`}
          stroke="#FFFFFF"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        {/* Corner indicators - Bottom Right */}
        <Path 
          d={`M ${x + w + 2} ${y + h - cornerRadius} L ${x + w + 2} ${y + h + 2} L ${x + w - cornerRadius} ${y + h + 2}`}
          stroke="#FFFFFF"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        {/* Corner indicators - Bottom Left */}
        <Path 
          d={`M ${x + cornerRadius} ${y + h + 2} L ${x - 2} ${y + h + 2} L ${x - 2} ${y + h - cornerRadius}`}
          stroke="#FFFFFF"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    elevation: 1000,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    elevation: 1000,
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: width * 2,
    height: height * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
  blurSection: {
    position: 'absolute',
    overflow: 'hidden',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 20,
  },
  cornerHandleInner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  handleIcon: {
    position: 'absolute',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 1000,
    elevation: 1000,
  },
  retakeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeActionText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  analyzeButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  analyzeButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  analyzeButtonText: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
