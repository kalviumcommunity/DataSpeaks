# Google OAuth Setup Guide

## Prerequisites
- Google Cloud Console account
- Node.js and npm installed

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen if prompted:
   - User Type: External (for testing) or Internal (for organization)
   - App name: DataSpeaks
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `userinfo.email`, `userinfo.profile`
   - Add test users if needed
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: DataSpeaks Web Client
   - Authorized JavaScript origins:
     - `http://localhost:5173` (frontend dev)
     - `http://localhost:3000` (backend dev)
     - Add your production URLs when deploying
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - Add your production callback URL when deploying
5. Click "Create"
6. Copy the Client ID and Client Secret

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Update the `.env` file with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   JWT_SECRET=your_random_secret_key_here
   SESSION_SECRET=your_random_session_secret_here
   FRONTEND_URL=http://localhost:5173
   ```

## Step 4: Generate Secure Secrets

Generate random secrets for JWT and Session:
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Session Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy these values to your `.env` file.

## Step 5: Install Dependencies

```bash
cd server
npm install
```

## Step 6: Start the Application

```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
cd client
npm run dev
```

## Step 7: Test OAuth Flow

1. Open http://localhost:5173
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back to the app

## Production Deployment

When deploying to production:

1. Update OAuth credentials in Google Cloud Console:
   - Add production URLs to Authorized JavaScript origins
   - Add production callback URL to Authorized redirect URIs

2. Update environment variables:
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. Use secure, random secrets for JWT_SECRET and SESSION_SECRET

4. Enable HTTPS for secure cookies

## Troubleshooting

### "redirect_uri_mismatch" error
- Verify the callback URL in Google Console matches exactly
- Include http:// or https://
- Check for trailing slashes

### "Access blocked" error
- Add your email as a test user in OAuth consent screen
- Publish the OAuth consent screen if ready

### Session issues
- Clear browser cookies
- Verify SESSION_SECRET is set
- Check CORS configuration allows credentials

## Security Notes

- Never commit `.env` file to version control
- Use strong, random secrets in production
- Enable HTTPS in production
- Set `secure: true` for cookies in production
- Regularly rotate secrets
- Limit OAuth scopes to only what's needed

## Optional: Database Integration

Currently, users are stored in-memory. For production:

1. Install a database driver (e.g., `mysql2`, `pg`, `mongodb`)
2. Update `server/config/passport.js` to save users to database
3. Create users table/collection with fields:
   - id
   - googleId
   - email
   - name
   - picture
   - createdAt
   - lastLogin
