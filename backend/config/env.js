// Centralised environment configuration.
// Loads .env once and validates that critical secrets are present so the
// app fails fast (at boot) instead of mid-request.
require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    // eslint-disable-next-line no-console
    console.error(`\n[FATAL] Missing required environment variable: ${name}`);
    console.error('Copy backend/.env.example to backend/.env and fill it in.\n');
    process.exit(1);
  }
  return value;
}

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',

  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: required('MONGODB_URI'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieMaxAgeDays: parseInt(process.env.COOKIE_MAX_AGE_DAYS, 10) || 7,

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
    // OAuth is optional at boot; routes guard against missing credentials.
    get enabled() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    // Gemini exposes an OpenAI-compatible endpoint, so we reuse the openai SDK
    // and just change the base URL. Overridable for future API versions.
    baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
    get enabled() {
      return Boolean(this.apiKey);
    },
  },
};

module.exports = env;
