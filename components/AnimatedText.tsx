import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface AnimatedTextProps {
  text: string;
  speed?: number; // milliseconds per character
  style?: any;
  onComplete?: () => void;
  isVisible?: boolean;
  maxWordsPerChunk?: number;
} 

export default function AnimatedText({ 
  text, 
  speed = 30, 
  style, 
  onComplete,
  isVisible = true,
  maxWordsPerChunk = 20
}: AnimatedTextProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [textPages, setTextPages] = useState<string[]>([]);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const textRef = useRef(text);

  // Split text into pages of maxWordsPerChunk words
  const splitTextIntoPages = (inputText: string): string[] => {
    const words = inputText.trim().split(/\s+/);
    const pages: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      const page = words.slice(i, i + maxWordsPerChunk).join(' ');
      pages.push(page);
    }
    
    return pages;
  };

  // Reset and start new text animation
  useEffect(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }

    if (!isVisible || !text || text.trim().length === 0) {
      setDisplayedText('');
      setIsAnimating(false);
      setCurrentPageIndex(0);
      setTextPages([]);
      setIsPageTransitioning(false);
      return;
    }

    if (text !== textRef.current) {
      textRef.current = text;
      const pages = splitTextIntoPages(text);
      setTextPages(pages);
      setCurrentPageIndex(0);
      setDisplayedText('');
      setIsAnimating(true);
      setIsPageTransitioning(false);
      
      // Start with first page
      animatePage(0, pages);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [text, isVisible, maxWordsPerChunk]);

  // Animate a specific page
  const animatePage = (pageIndex: number, pages: string[]) => {
    if (pageIndex >= pages.length) {
      setIsAnimating(false);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const page = pages[pageIndex];
    let currentIndex = 0;
    
    const animateText = () => {
      if (currentIndex < page.length) {
        setDisplayedText(page.substring(0, currentIndex + 1));
        currentIndex++;
        animationRef.current = setTimeout(animateText, speed);
      } else {
        // Wait 5 seconds before moving to next page
        setTimeout(() => {
          if (pageIndex + 1 < pages.length) {
            setIsPageTransitioning(true);
            setTimeout(() => {
              setCurrentPageIndex(pageIndex + 1);
              setIsPageTransitioning(false);
              animatePage(pageIndex + 1, pages);
            }, 300); // Fade out duration
          } else {
            setIsAnimating(false);
            if (onComplete) {
              onComplete();
            }
          }
        }, 5000); // 5 second delay
      }
    };

    animationRef.current = setTimeout(animateText, speed);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Current page with typing animation */}
      <Animatable.View 
        animation={isPageTransitioning ? "fadeOut" : "fadeIn"}
        duration={300}
        style={styles.textContainer}
      >
        <Text style={[styles.text, style]} numberOfLines={0} allowFontScaling={false}>
          {displayedText}
          {isAnimating && !isPageTransitioning && <Text style={styles.cursor}>|</Text>}
        </Text>
      </Animatable.View>

      {/* Page indicator - Fixed at bottom */}
      {textPages.length > 1 && (
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {currentPageIndex + 1} of {textPages.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  textContainer: {
    width: '100%',
    marginBottom: 20, // Add gap between text and page indicator
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  cursor: {
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: -40, // Move down a bit more to account for the gap
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
  },
  pageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    opacity: 0.8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
