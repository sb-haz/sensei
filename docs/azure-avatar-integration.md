# Azure Avatar Integration

This document explains how the Azure Avatar integration works in the Sensei AI Interview application.

## Overview

The application has been enhanced to use Azure Speech Avatar Studio instead of a static image for the AI interviewer. The avatar provides synchronized lip movement, facial expressions, and natural speech delivery.

## Key Components

### 1. Azure Avatar Service (`app/interview/services/azure-avatar.ts`)
- Manages the WebRTC connection to Azure Speech Service
- Handles avatar initialization, speech synthesis, and cleanup
- Provides a clean interface for speaking text and managing sessions

### 2. Azure Avatar Hook (`hooks/use-azure-avatar.ts`)
- React hook that wraps the Azure Avatar Service
- Manages component state and lifecycle
- Provides easy-to-use functions for React components

### 3. VideoGridWithAvatar Component (`app/interview/components/VideoGridWithAvatar.tsx`)
- Replaces the old VideoGrid component
- Displays the live Azure Avatar instead of a static image
- Handles avatar initialization and error states

### 4. Configuration (`lib/azure-config.ts`)
- Centralizes Azure configuration
- Uses environment variables for credentials
- Provides default values for avatar settings

## Configuration

### Environment Variables
Set these in your `.env.local` file:

```env
NEXT_PUBLIC_AZURE_SPEECH_KEY=your-azure-speech-key
NEXT_PUBLIC_AZURE_SPEECH_REGION=eastus2
NEXT_PUBLIC_AZURE_SPEECH_ENDPOINT=https://eastus2.api.cognitive.microsoft.com/
NEXT_PUBLIC_AVATAR_CHARACTER=lisa
NEXT_PUBLIC_AVATAR_STYLE=casual-sitting
NEXT_PUBLIC_AVATAR_VOICE=en-US-AvaMultilingualNeural
NEXT_PUBLIC_AVATAR_BACKGROUND_COLOR=#FFFFFFFF
```

### Avatar Characters Available
- `lisa` - Professional female avatar
- `josh` - Professional male avatar
- `anna` - Casual female avatar
- `ryan` - Casual male avatar

### Avatar Styles Available
- `casual-sitting` - Sitting position, casual setting
- `business-sitting` - Sitting position, professional setting
- `standing` - Standing position
- `casual-standing` - Standing position, casual setting

### Voices Available
- `en-US-AvaMultilingualNeural` - Female, American English
- `en-US-AndrewMultilingualNeural` - Male, American English
- `en-US-EmmaMultilingualNeural` - Female, American English
- `en-US-BrianMultilingualNeural` - Male, American English

## How It Works

### 1. Session Initialization
When the interview page loads:
1. The `VideoGridWithAvatar` component initializes the Azure Avatar service
2. A WebRTC connection is established with Azure Speech Service
3. The avatar video stream is displayed in the interviewer panel

### 2. Speaking Questions
When a new question is generated:
1. The interview page receives the question text from the AI API
2. Instead of using browser speech synthesis, it calls the Azure Avatar service
3. The avatar speaks the question with synchronized lip movement and gestures
4. The speaking state is tracked for UI feedback

### 3. User Interactions
- **Repeat Question**: Re-speaks the current question using the avatar
- **Skip Question**: Moves to next question (avatar stops speaking if active)
- **End Interview**: Cleanly stops the avatar session and WebRTC connection

### 4. Error Handling
- Fallback to browser speech synthesis if Azure Avatar fails
- Clear error messages displayed to users
- Retry functionality for avatar initialization
- Graceful degradation to static avatar if needed

## Technical Details

### WebRTC Integration
- Uses RTCPeerConnection for real-time avatar streaming
- Handles ICE server configuration for NAT traversal
- Manages audio/video track setup and cleanup

### Speech Synthesis
- SSML (Speech Synthesis Markup Language) for natural speech
- Configurable voice parameters (speed, pitch, etc.)
- Automatic HTML encoding for safety

### State Management
- React hooks for clean state management
- Global functions for cross-component communication
- Proper cleanup on component unmount

## Troubleshooting

### Common Issues

1. **Avatar fails to initialize**
   - Check Azure credentials in environment variables
   - Verify network connectivity
   - Check browser console for detailed error messages

2. **No video stream**
   - Verify WebRTC support in browser
   - Check firewall/proxy settings
   - Ensure ICE servers are accessible

3. **Speech not working**
   - Verify voice configuration
   - Check if browser audio is enabled
   - Look for SSML parsing errors

### Browser Support
- Chrome: Full support
- Firefox: Full support
- Safari: Limited WebRTC support
- Edge: Full support

### Performance Considerations
- WebRTC uses significant bandwidth
- Avatar video is optimized for quality vs. bandwidth
- Fallback mechanisms ensure functionality on slower connections

## Future Enhancements

1. **Multiple Avatar Options**: Allow users to choose their preferred interviewer avatar
2. **Emotion Recognition**: Sync avatar emotions with interview context
3. **Background Customization**: Virtual interview room backgrounds
4. **Multi-language Support**: Support for different languages and accents
5. **Avatar Personalization**: Custom avatars based on company branding

## Security Notes

- API keys are client-side visible (use environment variables)
- WebRTC connections are secure by default
- Consider using Azure private endpoints for additional security
- Implement rate limiting for API usage
