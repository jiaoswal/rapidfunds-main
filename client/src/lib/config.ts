// Configuration for AI services
export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.3,
  },
  
  // AI Summarizer Configuration
  summarizer: {
    enabled: true,
    cacheEnabled: true,
    fallbackEnabled: true,
  },
  
  // Daily Digest Configuration
  digest: {
    enabled: true,
    maxRequestsPerDigest: 20,
    refreshInterval: 30000, // 30 seconds
  }
};

// Helper function to check if OpenAI is properly configured
export const isOpenAIConfigured = (): boolean => {
  return config.openai.apiKey && 
         config.openai.apiKey !== 'your-openai-api-key-here' &&
         config.openai.apiKey.length > 10;
};

// Helper function to get configuration status
export const getConfigStatus = () => {
  return {
    openai: isOpenAIConfigured(),
    summarizer: config.summarizer.enabled,
    digest: config.digest.enabled,
  };
};
