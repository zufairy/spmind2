# Voice Service Debug Guide

## ✅ Confirmed Working
- ElevenLabs API: **Working** (Status 200)
- Audio Generation: **Working** (33KB MP3 files created)
- Model: `eleven_turbo_v2` **Available and working**
- Voice ID: `Wc6X61hTD7yucJMheuLN` **Valid**

## What Should Happen

### 1. Language Selection Page
- **Bubble Box**: Appears immediately (no animation delay)
- **Text**: "Hi {userName}! I'm Genybot, your AI tutor! 🤖"
- **Voice** (after 1.5s): "Hi {name}! I'm Genybot, your AI tutor. I will help you get started. Please select a language to begin."

### 2. Mode Selection Page
- **Bubble Box**: Appears immediately
- **Text**: "{name}, how would you like to complete your orientation?" (or Bahasa version)
- **Voice** (after 400ms): Full question about chat vs voice preference

### 3. Chat Mode
- **Loads**: Instantly (no lag)
- **First Message**: "Great {name}, Is this your full name, or would you like to provide your complete name?"
- **Voice**: Plays automatically with the message

### 4. Voice Mode
- **Voice**: Plays name confirmation question
- **Recording**: Works with hold-to-record button

## Console Logs to Look For

```
====================================
🔊 INITIAL GREETING STARTING
Text: Hi [Name]! I'm Genybot, your AI tutor...
====================================
🚀 Generating speech with turbo model...
⚡ API response received in XXXms
⚡ Speech generated in XXXms (file write: XXXms)
====================================
🔊 PLAY AUDIO CALLED
Audio URL: file://...
====================================
✅ Audio mode configured for loudspeaker
✅ Sound object created
📊 Playback status update: { isPlaying: true, ... }
====================================
✅ AUDIO IS PLAYING
Status: { isPlaying: true, durationMillis: XXXX, volume: 1.0 }
====================================
```

## If Voice Doesn't Play

1. **Check Console for Errors**:
   - Look for `❌` emoji markers
   - Check if generation succeeds but playback fails
   
2. **Verify Audio Mode**:
   - Should see "Audio mode configured for loudspeaker"
   - Should see `isPlaying: true` in status

3. **Check Device Settings**:
   - Volume is up
   - Silent mode is OFF
   - No headphones plugged in (or check headphones)

4. **Check Permissions**:
   - Audio permission granted (should prompt on first use)

## Features Implemented

✅ Speech bubble appears immediately on language page
✅ Bubble shows what AI is saying
✅ Voice uses ElevenLabs Turbo V2 model
✅ Comprehensive logging for debugging
✅ Chat loads instantly (0ms delay)
✅ No duplicate voice playback
✅ Audio plays from loudspeaker
✅ Status monitoring during playback




