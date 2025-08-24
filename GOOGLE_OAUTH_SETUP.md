# Google OAuth Setup Guide for NyambikaAI

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### Step 2: Enable Google+ API
1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" if available

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type (for testing with personal accounts)
3. Fill in required fields:
   - **App name**: NyambikaAI
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `openid`
   - `email` 
   - `profile`
5. Add test users (your email addresses for testing)
6. Save and continue

### Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - **Name**: NyambikaAI Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:3002`
   - **Authorized redirect URIs**:
     - `http://localhost:3002/api/auth/oauth/google/callback`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## 2. Update Environment Variables

Replace the placeholder values in your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_client_id_from_google_console
GOOGLE_CLIENT_SECRET=your_actual_client_secret_from_google_console
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/oauth/google/callback
FRONTEND_URL=http://localhost:3002

# JWT Secret for authentication (generate a secure random string)
JWT_SECRET=your_secure_jwt_secret_at_least_32_characters_long
```

## 3. Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 4. Test the Setup

1. Start your server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3001`

3. Click "Sign in with Google" button

4. You should be redirected to Google's OAuth consent screen

5. After approval, you should be redirected back and logged in

## 5. Troubleshooting

### Common Issues:

**"redirect_uri_mismatch" error:**
- Ensure the redirect URI in Google Console exactly matches: `http://localhost:3001/api/auth/oauth/google/callback`
- No trailing slashes, exact protocol (http vs https)

**"access_blocked" error:**
- Add your email as a test user in OAuth consent screen
- Ensure app is in "Testing" mode for development

**"invalid_client" error:**
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Ensure no extra spaces or quotes in .env file

### Production Setup:

For production deployment:
1. Update authorized origins and redirect URIs to your production domain
2. Submit app for verification if needed
3. Use environment-specific .env files
4. Use HTTPS for production URLs

## 6. Security Notes

- Keep your Client Secret secure and never commit it to version control
- Use different OAuth clients for development and production
- Regularly rotate your JWT secret
- Consider implementing OAuth state parameter for additional security
