// Server-side Azure Speech Service API
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { action, ...params } = await request.json();

        // Get Azure credentials from server-side environment variables
        const azureKey = process.env.AZURE_SPEECH_KEY;
        const azureRegion = process.env.AZURE_SPEECH_REGION;
        const azureEndpoint = process.env.AZURE_SPEECH_ENDPOINT;

        if (!azureKey || !azureRegion) {
            return NextResponse.json(
                { error: 'Azure Speech Service not configured' },
                { status: 500 }
            );
        }

        switch (action) {
            case 'getIceServerToken':
                return await getIceServerToken(azureKey, azureRegion, params.privateEndpoint);
            
            case 'getAuthToken':
                return await getAuthToken(azureKey, azureRegion);
            
            case 'getSpeechConfig':
                return NextResponse.json({
                    region: azureRegion,
                    endpoint: azureEndpoint,
                    // Don't return the key - client will get it via token
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Azure Speech API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

async function getAuthToken(azureKey: string, azureRegion: string) {
    const url = `https://${azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get auth token: ${response.status}`);
    }

    const token = await response.text();
    
    return NextResponse.json({
        token,
        region: azureRegion
    });
}

async function getIceServerToken(azureKey: string, azureRegion: string, privateEndpoint?: string) {
    const url = privateEndpoint
        ? `https://${privateEndpoint}/tts/cognitiveservices/avatar/relay/token/v1`
        : `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Ocp-Apim-Subscription-Key': azureKey
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get ICE server token: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
        urls: data.Urls,
        username: data.Username,
        password: data.Password
    });
}
