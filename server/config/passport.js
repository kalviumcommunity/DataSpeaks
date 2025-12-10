import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from 'dotenv';

// Load environment variables
config();

// In-memory user storage (replace with database in production)
const users = new Map();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

// Debug: Log if credentials are loaded
console.log('🔐 OAuth Config:', {
  clientID: process.env.GOOGLE_CLIENT_ID ? '✓ Loaded' : '✗ Missing',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✓ Loaded' : '✗ Missing',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = Array.from(users.values()).find(u => u.googleId === profile.id);

        if (!user) {
          // Create new user
          user = {
            id: Date.now().toString(),
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0]?.value,
            createdAt: new Date().toISOString(),
          };
          users.set(user.id, user);
        } else {
          // Update user info
          user.name = profile.displayName;
          user.picture = profile.photos[0]?.value;
          user.lastLogin = new Date().toISOString();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export { passport, users };
