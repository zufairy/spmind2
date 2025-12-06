# Multiplayer Testing Guide

## 🧪 **How to Test Multiplayer**

### **Step 1: Test with One Device First**
1. **Open the app** on your device
2. **Go to Lepak game**
3. **Look at the debug info** in the top-left corner:
   - `MP: ON` - Multiplayer is connected
   - `Room: None` - Not in a room yet
   - `Players: 0` - No other players

### **Step 2: Join a Room**
1. **Tap the Users icon** (👥) next to settings
2. **Select a language room** (English or Malay)
3. **Check debug info**:
   - `Room: english_room_park` (or similar)
   - `Players: 0` (still no other players)

### **Step 3: Test with Second Device**
1. **Open the app on another device/browser**
2. **Join the SAME room** (same language)
3. **Check debug info on BOTH devices**:
   - Both should show `MP: ON`
   - Both should show the same room ID
   - One should show `Players: 1` (the other player)

### **Step 4: Test Movement Synchronization**
1. **Move around on one device**
2. **Check if the other device sees the movement**
3. **Try chatting** - messages should appear on both devices

## 🔍 **Debug Information**

### **What to Look For:**
- **Console logs** - Check browser/device console for multiplayer logs
- **Debug panel** - Top-left shows multiplayer status
- **Network requests** - Check if database calls are working

### **Common Issues:**
1. **"MP: OFF"** - Multiplayer not connected
2. **"Room: None"** - Not joined to a room
3. **"Players: 0"** - No other players visible
4. **Error messages** - Check the debug panel for errors

## 🚀 **Expected Behavior**

### **When Working Correctly:**
- Both devices show `MP: ON`
- Both devices show the same room ID
- Players can see each other moving
- Chat messages appear on both devices
- Real-time synchronization works

### **If Not Working:**
- Check console logs for errors
- Verify database setup (run the SQL script)
- Check network connection
- Try refreshing the app

## 📱 **Testing Tips**

1. **Use different browsers** for testing (Chrome, Safari, etc.)
2. **Use incognito mode** to simulate different users
3. **Check console logs** for detailed error messages
4. **Try different rooms** if one doesn't work

## 🛠️ **Troubleshooting**

### **If you see errors:**
1. **Database errors** - Run the SQL script again
2. **Connection errors** - Check internet connection
3. **Room errors** - Try joining a different room
4. **Player errors** - Check if both devices are logged in

### **If players don't appear:**
1. **Check room ID** - Both devices must be in the same room
2. **Check real-time subscriptions** - Look for subscription logs
3. **Check player data** - Verify players are being added to the room
4. **Check position updates** - Verify movement is being sent to server

## 📊 **Debug Logs to Watch**

Look for these console messages:
- `"Joining room: [roomId] with player: [player]"`
- `"Room data fetched successfully: [data]"`
- `"Setting up real-time subscription for room: [roomId]"`
- `"Room updated via real-time: [payload]"`
- `"Other players updated: [players]"`
- `"Player position updated successfully: [data]"`

If you don't see these logs, there's an issue with the multiplayer setup.
