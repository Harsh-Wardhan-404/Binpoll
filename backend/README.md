# Binpoll Backend

A Node.js/Express backend for a polling application with Supabase database integration.

## Features

- 🗳️ Create and manage polls
- 👥 User management with Web3 wallet addresses
- ✅ Voting system with comments
- 🔒 Input validation with Zod
- 📊 RESTful API with comprehensive endpoints
- 🚀 PostgreSQL database with Supabase
- 🔧 Comprehensive error handling
- 📱 CORS enabled for frontend integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Validation**: Zod
- **Database Client**: Supabase Client + pg
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Environment**: dotenv

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # Database connection and Supabase client
│   │   └── environment.js   # Environment configuration
│   ├── middleware/
│   │   ├── errorHandler.js  # Global error handling
│   │   └── notFound.js      # 404 handler
│   ├── routes/
│   │   ├── userRoutes.js    # User management endpoints
│   │   ├── pollRoutes.js    # Poll management endpoints
│   │   └── pollOptionRoutes.js # Poll options and voting endpoints
│   ├── helpers/
│   │   ├── asyncHandler.js  # Async error handling utility
│   │   ├── validation.js    # Input validation schemas
│   │   ├── dateUtils.js     # Date utility functions
│   │   └── responseUtils.js # Standardized API responses
│   ├── migrations/
│   │   ├── 001_create_tables.sql # Database schema
│   │   └── run-migrations.js     # Migration runner
│   └── server.js            # Main application entry point
├── package.json
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   DATABASE_URL=your_postgresql_connection_string
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # JWT Configuration (for future authentication)
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:3001
   ```

4. **Run Database Migrations**
   ```bash
   npm run migrate
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```

## Database Schema

### Users Table
- `user_id` (UUID, Primary Key)
- `account_address` (VARCHAR, Unique) - Web3 wallet address
- `user_name` (VARCHAR) - Display name
- `photo_key` (VARCHAR) - Profile image key
- `created_at`, `updated_at` (Timestamps)

### Polls Table
- `poll_id` (UUID, Primary Key)
- `topic` (VARCHAR) - Poll title
- `description` (TEXT) - Poll description
- `creator_id` (UUID, Foreign Key) - References users table
- `number_of_polls` (INTEGER) - Number of polls allowed
- `limits_per_poll` (INTEGER) - Vote limit per poll
- `creator_fee` (DECIMAL) - Fee for poll creation
- `random_winner` (INTEGER) - Winner selection type (1-3)
- `start_date`, `end_date` (Timestamps)
- `created_at`, `updated_at` (Timestamps)

### Poll Options Table
- `poll_option_id` (UUID, Primary Key)
- `poll_id` (UUID, Foreign Key) - References polls table
- `option_text` (VARCHAR) - Option description
- `created_at`, `updated_at` (Timestamps)

### Poll Options Voters Table
- `id` (UUID, Primary Key)
- `poll_option_id` (UUID, Foreign Key) - References poll_options table
- `voter_id` (UUID, Foreign Key) - References users table
- `comments` (TEXT) - Optional voting comments
- `created_at` (Timestamp)

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/address/:address` - Get user by wallet address
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Polls
- `GET /api/polls` - Get all polls (paginated)
- `GET /api/polls/:id` - Get poll by ID with options and votes
- `GET /api/polls/creator/:creatorId` - Get polls by creator
- `GET /api/polls/status/active` - Get currently active polls
- `POST /api/polls` - Create new poll
- `PUT /api/polls/:id` - Update poll
- `DELETE /api/polls/:id` - Delete poll

### Poll Options & Voting
- `GET /api/poll-options/poll/:pollId` - Get options for a poll
- `GET /api/poll-options/:id` - Get single poll option with votes
- `GET /api/poll-options/:id/votes` - Get all votes for an option
- `POST /api/poll-options` - Create new poll option
- `POST /api/poll-options/:id/vote` - Vote for an option
- `PUT /api/poll-options/:id` - Update poll option
- `DELETE /api/poll-options/:id` - Delete poll option
- `DELETE /api/poll-options/:id/vote/:voterId` - Remove vote

### Health Check
- `GET /health` - Server health status

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run migrate` - Run database migrations

## Error Handling

The API includes comprehensive error handling with:
- Standardized error responses
- Input validation errors
- Database constraint errors
- Async/await error catching
- Development vs production error details

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2025-01-22T00:51:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ],
  "timestamp": "2025-01-22T00:51:00.000Z"
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Submit a pull request

## License

MIT License
