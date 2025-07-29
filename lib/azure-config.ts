import { AzureAvatarConfig } from '../app/interview/services/azure-avatar';

export function getAzureAvatarConfig(): AzureAvatarConfig {
    const config = {
        region: process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || 'eastus2',
        subscriptionKey: '', // No longer using client-side key
        privateEndpoint: process.env.NEXT_PUBLIC_AZURE_PRIVATE_ENDPOINT || undefined,
        character: process.env.NEXT_PUBLIC_AVATAR_CHARACTER || 'lisa',
        style: process.env.NEXT_PUBLIC_AVATAR_STYLE || 'casual-sitting',
        voice: process.env.NEXT_PUBLIC_AVATAR_VOICE || 'en-US-AvaMultilingualNeural',
        backgroundColor: process.env.NEXT_PUBLIC_AVATAR_BACKGROUND_COLOR || '#FFFFFFFF',
        videoCrop: false,
        transparentBackground: false
    };

    console.log('Azure Avatar Config loaded:', {
        region: config.region,
        character: config.character,
        style: config.style,
        voice: config.voice,
        usingSecureApi: true
    });

    return config;
}

export const AZURE_AVATAR_CONFIG = getAzureAvatarConfig();
