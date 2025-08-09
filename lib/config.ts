/**
 * Environment configuration utility
 * Centralizes environment variable handling and validation
 */

interface Config {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Azure
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  azureSpeechEndpoint?: string;
  
  // Azure OpenAI
  azureOpenAIEndpoint?: string;
  azureOpenAIApiKey?: string;
  azureOpenAIDeploymentName?: string;
  
  // AI APIs
  deepseekApiKey?: string;
  
  // App settings
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function getEnvVar(name: string, required = true): string | undefined {
  const value = process.env[name];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value;
}

export const config: Config = {
  // Required variables
  supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL')!,
  supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY')!,
  
  // Optional variables
  azureSpeechKey: getEnvVar('AZURE_SPEECH_KEY', false),
  azureSpeechRegion: getEnvVar('AZURE_SPEECH_REGION', false),
  azureSpeechEndpoint: getEnvVar('AZURE_SPEECH_ENDPOINT', false),
  azureOpenAIEndpoint: getEnvVar('AZURE_OPENAI_ENDPOINT', false),
  azureOpenAIApiKey: getEnvVar('AZURE_OPENAI_API_KEY', false),
  azureOpenAIDeploymentName: getEnvVar('AZURE_OPENAI_DEPLOYMENT_NAME', false),
  deepseekApiKey: getEnvVar('DEEPSEEK_API_KEY', false),
  
  // App environment
  nodeEnv: getEnvVar('NODE_ENV') || 'development',
  isDevelopment: (getEnvVar('NODE_ENV') || 'development') === 'development',
  isProduction: (getEnvVar('NODE_ENV') || 'development') === 'production',
};

/**
 * Validates that required services are configured
 */
export function validateServiceConfig(service: 'azure' | 'deepseek' | 'azureOpenAI'): boolean {
  switch (service) {
    case 'azure':
      return !!(config.azureSpeechKey && config.azureSpeechRegion);
    case 'deepseek':
      return !!config.deepseekApiKey;
    case 'azureOpenAI':
      return !!(config.azureOpenAIEndpoint && config.azureOpenAIApiKey && config.azureOpenAIDeploymentName);
    default:
      return false;
  }
}
