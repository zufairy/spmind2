# Onboarding Page Status

## Current Issues

The onboarding page has structural JSX errors that need to be fixed. Here's what we were trying to implement:

### Planned Features:
1. ✅ Profile picture on top-left (sprite1.png, no green outline, with margin)
2. ✅ Switch slider on top-right
3. ✅ Robot avatar with blinking eyes (not transforming)
4. ✅ Language selection (English, Bahasa Melayu)
5. ✅ Voice greeting with user's name from database
6. ✅ Mode selection (Chat/Voice)

### What Needs Fixing:
- JSX structure has mismatched tags
- Too many nested Animatable.Views causing lag
- Eyes animation should be simple blink (scaleY), not complex transforms
- Buttons not showing due to JSX errors

### Recommended Solution:
1. Simplify animations - remove complex nested Animatable components
2. Use simple blink for eyes (scaleY: 1 → 0.1 → 1)
3. Remove excessive floating/rotating animations
4. Keep structure simple: View > Avatar > Buttons
5. Test thoroughly after each change

### Key Points:
- Profile picture: sprite1.png, 44x44px, square, white border, margin-right: 12px
- Switch: Top-right, 80x40px, green thumb slides left/right  
- Robot eyes: 42x42px, blink every 4 seconds
- Language buttons: Glass effect, full width
- Mode buttons: Minimal, white icons, side by side

The page needs structural cleanup before it can run properly.




