const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = function(passport) {
  // Local strategy for email/password login
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
          return done(null, false, { message: 'Email tidak terdaftar' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Password salah' });
        }
        
        return done(null, user);
      } catch (error) {
        logger.error('Local strategy error:', error);
        return done(error);
      }
    })
  );
  
  // Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.YOUTUBE_CLIENT_ID,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            // Update tokens
            user.googleAccessToken = accessToken;
            user.googleRefreshToken = refreshToken;
            await user.save();
            return done(null, user);
          }
          
          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // Link Google account
            user.googleId = profile.id;
            user.googleAccessToken = accessToken;
            user.googleRefreshToken = refreshToken;
            user.isVerified = true;
            await user.save();
            return done(null, user);
          }
          
          // Create new user
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken,
            isVerified: true,
            authProvider: 'google'
          });
          
          await newUser.save();
          done(null, newUser);
        } catch (error) {
          logger.error('Google strategy error:', error);
          done(error, null);
        }
      }
    )
  );
  
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
