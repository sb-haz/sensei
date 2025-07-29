// Azure Avatar Diagnostic Script
// Run this in browser console to test Azure connectivity

async function testAzureConnection() {
    console.log('🔍 Testing Azure Avatar Connection...');
    
    const config = {
        region: 'eastus2',
        subscriptionKey: 'ba1454b2f8e0426b9350dd67933a5877'
    };
    
    console.log('📋 Configuration:', {
        region: config.region,
        keyPrefix: config.subscriptionKey.substring(0, 8) + '...'
    });
    
    // Test 1: Check if Speech SDK can be loaded
    console.log('🔄 Test 1: Loading Azure Speech SDK...');
    try {
        if (typeof window.SpeechSDK === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://aka.ms/csspeech/jsbrowserpackageraw';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                setTimeout(reject, 10000); // 10 second timeout
            });
        }
        console.log('✅ Speech SDK loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load Speech SDK:', error);
        return;
    }
    
    // Test 2: Test ICE server token request
    console.log('🔄 Test 2: Testing ICE server token request...');
    try {
        const url = `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Ocp-Apim-Subscription-Key': config.subscriptionKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ ICE server token received:', {
                urlsCount: data.Urls?.length,
                hasCredentials: !!(data.Username && data.Password)
            });
        } else {
            const errorText = await response.text();
            console.error('❌ ICE server token request failed:', {
                status: response.status,
                error: errorText
            });
            return;
        }
    } catch (error) {
        console.error('❌ ICE server token request error:', error);
        return;
    }
    
    // Test 3: Test basic speech config creation
    console.log('🔄 Test 3: Testing speech config creation...');
    try {
        const speechConfig = window.SpeechSDK.SpeechConfig.fromSubscription(
            config.subscriptionKey, 
            config.region
        );
        
        if (speechConfig) {
            console.log('✅ Speech config created successfully');
        } else {
            console.error('❌ Failed to create speech config');
            return;
        }
    } catch (error) {
        console.error('❌ Speech config creation error:', error);
        return;
    }
    
    // Test 4: Test avatar config creation
    console.log('🔄 Test 4: Testing avatar config creation...');
    try {
        const videoFormat = new window.SpeechSDK.AvatarVideoFormat();
        const avatarConfig = new window.SpeechSDK.AvatarConfig('lisa', 'casual-sitting', videoFormat);
        
        if (avatarConfig) {
            console.log('✅ Avatar config created successfully');
        } else {
            console.error('❌ Failed to create avatar config');
            return;
        }
    } catch (error) {
        console.error('❌ Avatar config creation error:', error);
        return;
    }
    
    console.log('🎉 All tests passed! Azure Avatar should work correctly.');
    console.log('💡 If you\'re still seeing issues, check:');
    console.log('   - Network connectivity');
    console.log('   - Browser WebRTC support');
    console.log('   - Firewall/proxy settings');
}

// Auto-run the test
testAzureConnection().catch(console.error);
