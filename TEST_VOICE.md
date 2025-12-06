# Voice Service Test Guide

## What to Check in Console

When the onboarding page loads, you should see these logs:

### 1. **Initial Page Load**
```
🔊 Audio system initialized
🔊 Initial greeting - Generating speech for: Hi [Name]! I'm Genybot, your AI tutor. I will help you get started. Please select a language to begin.
🚀 Generating speech with turbo model...
⚡ API response received in XXXms
⚡ Speech generated in XXXms (file write: XXXms)
🔊 Speech generation result: { success: true, audioUrl: '...' }
🔊 Playing audio from: file://...
🔊 playAudio called with: file://...
🔊 Audio mode configured
✅ Sound created and playing
🔊 Volume set to maximum (1.0)
🔊 Sound status: { isPlaying: true, positionMillis: 0, durationMillis: XXXX }
🔊 Audio playback completed: true
```

### 2. **After Selecting Language**
```
🔊 Mode selection greeting - Language: en (or ms)
🔊 Playing: Great [Name]! Now, how would you like to complete your orientation?...
🚀 Generating speech with turbo model...
⚡ API response received in XXXms
...
```

### 3. **After Selecting Chat/Voice**
```
🎯 Mode selected: chat (or voice)
💬 Chat mode - Loading first question (or 🎤 Voice mode)
🔊 Generating and playing speech: Great [Name], Is this your full name...
...
```

## If Voice Doesn't Play

Check for these error messages:
- `❌ Speech generation failed:` - API issue
- `❌ Voice error:` - Generation error
- `Error playing audio:` - Playback error

## Expected Behavior

1. **Page opens** → Voice greeting plays automatically
2. **Speech bubble** → Shows full greeting text while playing
3. **Avatar state** → Changes to 'talking' during playback
4. **After playback** → Avatar returns to 'idle', bubble shows short version

## Models Used
- **Model**: `eleven_turbo_v2` (fast generation)
- **Voice ID**: `Wc6X61hTD7yucJMheuLN`
- **Settings**: Optimized for speed (stability: 0.3, similarity: 0.5)




