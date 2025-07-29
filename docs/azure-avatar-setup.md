# Quick Setup Guide for Azure Avatar

## Prerequisites
1. Azure subscription with Speech Service resource
2. Node.js and npm/pnpm installed
3. Modern browser with WebRTC support

## Setup Steps

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_AZURE_SPEECH_KEY=ba1454b2f8e0426b9350dd67933a5877
NEXT_PUBLIC_AZURE_SPEECH_REGION=eastus2
NEXT_PUBLIC_AZURE_SPEECH_ENDPOINT=https://eastus2.api.cognitive.microsoft.com/
NEXT_PUBLIC_AVATAR_CHARACTER=lisa
NEXT_PUBLIC_AVATAR_STYLE=casual-sitting
NEXT_PUBLIC_AVATAR_VOICE=en-US-AvaMultilingualNeural
```

### 2. Install Dependencies
The Azure Speech SDK is loaded dynamically, so no additional npm packages are required.

### 3. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. Navigate to an interview session
3. Look for the "Starting avatar..." loading message
4. Once connected, you should see "Live" indicator
5. The avatar should speak questions automatically

### 4. Troubleshooting

**If the avatar doesn't load:**
1. Check browser console for errors
2. Verify Azure credentials are correct
3. Ensure your browser supports WebRTC
4. Try refreshing the page

**If speech doesn't work:**
1. Check browser audio permissions
2. Verify the voice name is correct
3. Look for SSML errors in console

**Network issues:**
1. Check if your firewall blocks WebRTC
2. Try different network (mobile hotspot)
3. Verify Azure region is accessible

### 5. Testing Different Configurations

You can test different avatar configurations by changing the environment variables:

**Different Avatar Characters:**
```env
NEXT_PUBLIC_AVATAR_CHARACTER=josh  # Male avatar
NEXT_PUBLIC_AVATAR_CHARACTER=anna  # Alternative female avatar
```

**Different Styles:**
```env
NEXT_PUBLIC_AVATAR_STYLE=business-sitting  # Professional setting
NEXT_PUBLIC_AVATAR_STYLE=standing          # Standing pose
```

**Different Voices:**
```env
NEXT_PUBLIC_AVATAR_VOICE=en-US-AndrewMultilingualNeural  # Male voice
NEXT_PUBLIC_AVATAR_VOICE=en-US-EmmaMultilingualNeural    # Alternative female voice
```

### 6. Success Indicators

When everything is working correctly, you should see:
- ✅ Avatar video stream in the interviewer panel
- ✅ "Live" indicator in top-right corner
- ✅ Speaking indicator when avatar talks
- ✅ Synchronized lip movement with speech
- ✅ No errors in browser console

### 7. Fallback Behavior

If Azure Avatar fails, the system will:
- Show an error message with retry button
- Fall back to browser speech synthesis
- Continue with the interview functionality
- Allow manual retry of avatar initialization

## Production Considerations

1. **API Key Security**: Consider using Azure Key Vault for production
2. **Rate Limiting**: Monitor Azure Speech Service usage
3. **Error Monitoring**: Implement proper error tracking
4. **Performance**: Monitor WebRTC connection quality
5. **Scaling**: Consider regional deployment for global users
