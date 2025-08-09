// Server-side Azure Speech Service API
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/error-handling';
import { config, validateServiceConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
    return withErrorHandling(async () => {
        const { action, ...params } = await request.json();

        // Validate Azure configuration
        if (!validateServiceConfig('azure')) {
            logger.error('Azure Speech Service not configured properly');
            return NextResponse.json(
                { error: 'Azure Speech Service not configured' },
                { status: 500 }
            );
        }

        const { azureSpeechKey, azureSpeechRegion, azureSpeechEndpoint } = config;

        switch (action) {
            case 'getIceServerToken':
                return await getIceServerToken(azureSpeechKey!, azureSpeechRegion!, params.privateEndpoint);
            
            case 'getAuthToken':
                return await getAuthToken(azureSpeechKey!, azureSpeechRegion!);
            
            case 'getSpeechConfig':
                return NextResponse.json({
                    region: azureSpeechRegion,
                    endpoint: azureSpeechEndpoint,
                    // Don't return the key - client will get it via token
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    }, 'azure-speech')();
}

async function getAuthToken(azureKey: string, azureRegion: string) {
    const url = `https://${azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;

    logger.api(`Getting auth token from ${url}`);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!response.ok) {
        logger.error(`Failed to get auth token: ${response.status}`);
        throw new Error(`Failed to get auth token: ${response.status}`);
    }

    const token = await response.text();
    logger.info('Auth token obtained successfully');
    
    return NextResponse.json({
        token,
        region: azureRegion
    });
}

async function getIceServerToken(azureKey: string, azureRegion: string, privateEndpoint?: string) {
    const url = privateEndpoint
        ? `https://${privateEndpoint}/tts/cognitiveservices/avatar/relay/token/v1`
        : `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`;

    logger.api(`Getting ICE server token from ${url}`);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Ocp-Apim-Subscription-Key': azureKey
        }
    });

    if (!response.ok) {
        logger.error(`Failed to get ICE server token: ${response.status}`);
        throw new Error(`Failed to get ICE server token: ${response.status}`);
    }

    const data = await response.json();
    logger.info('ICE server token obtained successfully');
    
    return NextResponse.json({
        urls: data.Urls,
        username: data.Username,
        password: data.Password
    });
}
