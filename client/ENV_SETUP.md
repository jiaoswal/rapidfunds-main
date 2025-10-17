# Environment Setup Instructions

## OpenAI API Key Configuration

Your OpenAI API key has been configured in the code, but for best practices, you should also set up the environment variable.

### Option 1: Create .env file (Recommended)

Create a file named `.env` in the `client` directory with the following content:

```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Option 2: Set Environment Variable

#### Windows (PowerShell):
```powershell
$env:VITE_OPENAI_API_KEY="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"
```

#### Windows (Command Prompt):
```cmd
set VITE_OPENAI_API_KEY=your_openai_api_key_here
```

#### macOS/Linux:
```bash
export VITE_OPENAI_API_KEY="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"
```

### Restart Development Server

After setting up the environment variable, restart your development server:

```bash
cd client
npm run dev
```

## Testing the AI Features

1. **Create a Funding Request**:
   - Go to "Create Request" in the sidebar
   - Fill in all required fields
   - Write a detailed justification (this triggers AI summarization)
   - Submit the request

2. **View AI Summary**:
   - Go to the Dashboard
   - If you're an Admin or Approver, you'll see the "Daily Digest" section
   - The AI summary will show with insights and recommendations

3. **Test Quick Actions**:
   - In the Daily Digest, use the Quick Approve/Reject/Needs Info buttons
   - The AI recommendations will help guide your decisions

## Troubleshooting

If the AI features don't work:

1. Check the browser console for error messages
2. Verify the API key is correctly set
3. Ensure you have credits in your OpenAI account
4. Try refreshing the page after setting the environment variable

## Security Note

The API key is currently configured to work in the browser for development. For production deployment, this should be moved to a server-side endpoint for security.

