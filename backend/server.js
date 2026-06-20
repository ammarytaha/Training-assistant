const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('passport');

const env = require('./config/env');
const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const planRoutes = require('./routes/plans');
const sessionRoutes = require('./routes/sessions');
const coachRoutes = require('./routes/coach');
const chatRoutes = require('./routes/chat');
const profileRoutes = require('./routes/profile');
const scheduleRoutes = require('./routes/schedule');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const nutritionRoutes = require('./routes/nutrition');
const mealLibraryRoutes = require('./routes/mealLibrary');

const app = express();

// Behind a reverse proxy (Render/Railway/Nginx) so secure cookies work.
app.set('trust proxy', 1);

// ─── Security & parsing middleware ──────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl, // exact frontend origin
    credentials: true, // allow cookies to be sent cross-site
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize()); // strip $/. keys -> prevents NoSQL injection
if (!env.isProd) app.use(morgan('dev'));

// Serve uploaded exercise photos as static files.
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Passport (OAuth strategies only; stateless)
configurePassport();
app.use(passport.initialize());

// ─── Health check ───────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── API routes ─────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/coach/meal-library', mealLibraryRoutes);

// ─── 404 + error handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ───────────────────────────────────────────────────────────
(async () => {
  await connectDB();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] API running on ${env.serverUrl} (${env.nodeEnv})`);
  });
})();
