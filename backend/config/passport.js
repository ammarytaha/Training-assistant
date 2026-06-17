const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const env = require('./env');

// We use Passport ONLY for the OAuth handshake (stateless: session=false).
// After the strategy verifies the Google profile we issue our own JWT.
function configurePassport() {
  if (!env.google.enabled) {
    // eslint-disable-next-line no-console
    console.warn('[passport] Google OAuth disabled (no GOOGLE_CLIENT_ID/SECRET set).');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(null, false, { message: 'Google account has no email.' });
          }

          // 1) Already linked to this Google id -> log in.
          let user = await User.findOne({ provider: 'google', providerId: profile.id });
          if (user) return done(null, user);

          // 2) Email exists as a local account -> link Google to it
          //    (prevents duplicate accounts for the same person).
          user = await User.findOne({ email });
          if (user) {
            if (user.provider === 'local') {
              user.provider = 'google';
              user.providerId = profile.id;
              if (!user.avatar) user.avatar = profile.photos?.[0]?.value || null;
              await user.save();
            }
            return done(null, user);
          }

          // 3) Brand new user -> create a Google-backed account.
          user = await User.create({
            name: profile.displayName || email.split('@')[0],
            email,
            provider: 'google',
            providerId: profile.id,
            avatar: profile.photos?.[0]?.value || null,
            role: 'trainee',
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

module.exports = configurePassport;
