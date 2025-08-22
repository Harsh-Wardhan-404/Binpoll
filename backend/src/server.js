const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/environment');
const { testConnection } = require('./config/database');

// Import routes
const userRoutes = require('./routes/userRoutes');
const pollRoutes = require('./routes/pollRoutes');
const pollOptionRoutes = require('./routes/pollOptionRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging middleware
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/poll-options', pollOptionRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Database: Connected`);
      if (config.isDevelopment) {
        console.log(`📍 Health check: http://localhost:${config.port}/health`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
