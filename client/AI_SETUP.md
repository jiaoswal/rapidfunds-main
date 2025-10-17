# AI Summarization Setup Guide

This guide will help you set up the AI-powered summarization feature for funding requests.

## Features

- **AI-Powered Summaries**: Automatically generates concise, action-ready briefs for approvers
- **Daily Digest**: Shows pending requests with AI summaries and quick approval buttons
- **Smart Insights**: Highlights purpose, amount, urgency, and business impact
- **Quick Actions**: Approve/Reject/Needs Info buttons directly in the digest

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (it starts with `sk-`)

### 2. Configure Environment Variables

Create a `.env` file in the `client` directory:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important**: Replace `sk-your-actual-api-key-here` with your actual OpenAI API key.

### 3. Install Dependencies

The required dependencies are already installed:
- `openai` - OpenAI JavaScript SDK

### 4. Usage

#### For Members (Request Creators):
1. Create a funding request with a detailed justification
2. The AI will automatically generate a summary when the request is submitted
3. The summary helps approvers understand the request quickly

#### For Approvers:
1. Log in to the dashboard
2. View the "Daily Digest" section (only visible to Admins and Approvers)
3. See AI-generated summaries for all pending requests
4. Use quick action buttons to approve, reject, or request more information
5. View detailed request information by clicking "View Details"

## AI Summary Features

### Summary Content:
- **Concise Overview**: One-sentence summary of the request
- **Key Points**: 3 bullet points highlighting important aspects
- **Business Insights**: 2-3 insights about business impact and concerns
- **Urgency Assessment**: AI-determined urgency level (Low/Medium/High/Critical)
- **Impact Analysis**: Brief description of business impact
- **Recommendation**: AI suggestion (Approve/Reject/Review)

### Daily Digest Features:
- **Request Overview**: Title, amount, requester, days pending
- **AI Summary**: Generated insights and recommendations
- **Progress Tracking**: Checklist completion percentage
- **Quick Actions**: One-click approve/reject/needs info
- **Urgency Indicators**: Color-coded urgency levels
- **Statistics**: Total pending amount and urgent count

## Configuration Options

Edit `client/src/lib/config.ts` to customize:

```typescript
export const config = {
  openai: {
    model: 'gpt-3.5-turbo',        // AI model to use
    maxTokens: 500,                // Maximum response length
    temperature: 0.3,              // Response creativity (0-1)
  },
  summarizer: {
    enabled: true,                 // Enable/disable AI summaries
    cacheEnabled: true,            // Cache summaries for performance
    fallbackEnabled: true,         // Use fallback when AI fails
  },
  digest: {
    enabled: true,                 // Enable/disable daily digest
    maxRequestsPerDigest: 20,      // Maximum requests in digest
    refreshInterval: 30000,        // Auto-refresh interval (ms)
  }
};
```

## Fallback Behavior

If OpenAI is not configured or fails:
- System automatically uses a fallback summary generator
- Basic summaries are created with available data
- No functionality is lost - system continues to work

## Security Notes

**Development**: The current setup allows browser access to OpenAI for development convenience.

**Production**: For production deployment, move the OpenAI API calls to a server-side endpoint to keep API keys secure.

## Troubleshooting

### Common Issues:

1. **"OpenAI not configured" warning**
   - Check that your `.env` file exists and has the correct API key
   - Restart the development server after adding the API key

2. **AI summaries not generating**
   - Verify your OpenAI API key is valid and has credits
   - Check browser console for error messages
   - Ensure the justification field is filled when creating requests

3. **Daily digest not showing**
   - Verify you're logged in as an Admin or Approver
   - Check that there are pending requests
   - Try refreshing the page

### Getting Help:

- Check browser console for error messages
- Verify API key has sufficient credits
- Ensure all dependencies are installed
- Check network connectivity

## Cost Considerations

OpenAI API usage is based on tokens:
- Each summary costs approximately $0.001-0.005
- Costs scale with request complexity and justification length
- Monitor usage in your OpenAI dashboard

## Next Steps

1. Set up your OpenAI API key
2. Create a test funding request with detailed justification
3. Check the dashboard for the AI summary in the Daily Digest
4. Test the quick approval buttons
5. Customize configuration as needed

The AI summarization system is now ready to help your approvers make faster, more informed decisions! 🚀

