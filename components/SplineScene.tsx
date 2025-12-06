import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface SplineSceneProps {
  sceneUrl: string;
  width?: number;
  height?: number;
  style?: any;
}

export default function SplineScene({ 
  sceneUrl, 
  width = 200, 
  height = 200,
  style 
}: SplineSceneProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Create iframe HTML with interactive Spline that follows touch
  const splineHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=0.6, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            width: 100%; 
            height: 100%; 
            overflow: hidden; 
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            touch-action: none;
          }
          iframe { 
            width: 150%; 
            height: 150%; 
            border: none;
            transform: scale(0.65);
            transform-origin: center center;
            pointer-events: auto;
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
        <iframe id="splineFrame" src="${sceneUrl}" frameborder="0" allowfullscreen></iframe>
        <script>
          // Make Spline interactive and responsive to touch
          let lastX = 0;
          let lastY = 0;
          
          // Track touch/mouse movements
          document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              lastX = touch.clientX;
              lastY = touch.clientY;
            }
          }, { passive: true });
          
          document.addEventListener('mousemove', function(e) {
            lastX = e.clientX;
            lastY = e.clientY;
          }, { passive: true });
          
          // Additional watermark removal after load
          window.addEventListener('load', function() {
            setTimeout(function() {
              const iframe = document.querySelector('iframe');
              if (iframe && iframe.contentDocument) {
                try {
                  const style = iframe.contentDocument.createElement('style');
                  style.textContent = \`
                    #logo, .logo, [class*="logo"], [id*="logo"],
                    a[href*="spline"], a[target="_blank"],
                    div[style*="position: absolute"][style*="bottom"],
                    div[style*="position: fixed"][style*="bottom"] {
                      display: none !important;
                      opacity: 0 !important;
                      visibility: hidden !important;
                    }
                  \`;
                  iframe.contentDocument.head.appendChild(style);
                } catch(e) {}
              }
            }, 1000);
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <WebView
        source={{ html: splineHTML }}
        style={styles.webview}
        startInLoadingState={true}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          console.log('WebView error:', syntheticEvent.nativeEvent);
          setIsLoading(false);
        }}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading 3D...</Text>
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs={true}
        allowFileAccess={true}
      />
      {/* Show loading spinner overlay while loading */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading 3D...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

