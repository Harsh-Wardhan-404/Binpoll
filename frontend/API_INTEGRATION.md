# API Integration Documentation

This document explains how the frontend integrates with the backend API for poll operations.

## Overview

The frontend now uses a proper API client to communicate with the backend instead of relying on localStorage. This provides:

- Real-time data persistence
- Proper authentication
- Scalable architecture
- Better error handling

## File Structure

```
frontend/src/
├── lib/
│   ├── api.ts              # Main API client
│   └── supabase.ts         # Supabase configuration
├── hooks/
│   ├── usePolls.ts         # Poll operations hook
│   ├── useAuth.ts          # Authentication hook
│   └── useContractWagmi.ts # Blockchain operations
├── types/
│   └── index.ts            # TypeScript interfaces
└── components/
    ├── Dashboard.tsx       # Main dashboard (updated)
    ├── CreatePollModal.tsx # Poll creation (updated)
    └── ApiTest.tsx         # Test component
```

## API Client (`lib/api.ts`)

The API client provides a centralized way to communicate with the backend:

### Key Features:
- Automatic token management
- Error handling
- Request/response typing
- Base URL configuration

### Main Methods:
- `getPolls(params)` - Fetch polls with filters
- `createPoll(data)` - Create a new poll
- `getPoll(id)` - Get a single poll
- `voteOnPoll(pollId, optionIndex, amount)` - Vote on a poll
- `getMyVotes()` - Get user's votes
- `getPollsByCreator(address)` - Get polls by creator

## Poll Hook (`hooks/usePolls.ts`)

The `usePolls` hook provides a React-friendly interface for poll operations:

### State Management:
- `polls` - Array of polls
- `loading` - Loading state
- `error` - Error messages
- `pagination` - Pagination info

### Methods:
- `fetchPolls(params)` - Fetch polls with optional filters
- `createPoll(data)` - Create a new poll
- `getPoll(id)` - Get a single poll
- `voteOnPoll(pollId, optionIndex, amount)` - Vote on a poll
- `getMyVotes()` - Get user's votes
- `getPollsByCreator(address)` - Get polls by creator

## Authentication (`hooks/useAuth.ts`)

The authentication hook manages user authentication:

### Features:
- Wallet-based authentication
- Token management
- Automatic token verification
- Profile updates

### Methods:
- `authenticate()` - Authenticate with wallet
- `logout()` - Logout user
- `updateProfile(username)` - Update user profile
- `signMessage(address)` - Sign authentication message

## Usage Examples

### Creating a Poll

```typescript
import { usePolls } from '../hooks/usePolls';

const MyComponent = () => {
  const { createPoll, loading } = usePolls();

  const handleCreatePoll = async () => {
    const newPoll = await createPoll({
      title: 'My Poll',
      description: 'Poll description',
      options: ['Option 1', 'Option 2'],
      durationHours: 24,
      category: 'General'
    });

    if (newPoll) {
      console.log('Poll created:', newPoll);
    }
  };

  return (
    <button onClick={handleCreatePoll} disabled={loading}>
      {loading ? 'Creating...' : 'Create Poll'}
    </button>
  );
};
```

### Fetching Polls

```typescript
import { usePolls } from '../hooks/usePolls';

const PollsList = () => {
  const { polls, loading, error, fetchPolls } = usePolls();

  useEffect(() => {
    fetchPolls({
      page: 1,
      limit: 10,
      category: 'Technology',
      status: 'active'
    });
  }, [fetchPolls]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {polls.map(poll => (
        <div key={poll.id}>
          <h3>{poll.title}</h3>
          <p>{poll.description}</p>
        </div>
      ))}
    </div>
  );
};
```

### Voting on a Poll

```typescript
import { usePolls } from '../hooks/usePolls';

const PollVote = ({ pollId }: { pollId: string }) => {
  const { voteOnPoll } = usePolls();

  const handleVote = async (optionIndex: number) => {
    try {
      await voteOnPoll(pollId, optionIndex, '0.001');
      console.log('Vote submitted successfully');
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleVote(0)}>Vote Option 1</button>
      <button onClick={() => handleVote(1)}>Vote Option 2</button>
    </div>
  );
};
```

## Environment Configuration

Make sure to set the API URL in your environment variables:

```bash
# .env
VITE_API_URL=http://localhost:3000/api
```

## Error Handling

The API client includes comprehensive error handling:

- Network errors
- Authentication errors
- Validation errors
- Server errors

Errors are automatically logged and can be handled in components.

## Testing

Use the `ApiTest` component to test API functionality:

```typescript
import ApiTest from './components/ApiTest';

// Add to your app for testing
<ApiTest />
```

## Backend Integration

The frontend expects the backend to provide these endpoints:

- `GET /api/polls` - List polls
- `POST /api/polls` - Create poll
- `GET /api/polls/:id` - Get single poll
- `POST /api/polls/:id/vote` - Vote on poll
- `GET /api/polls/my-votes` - Get user votes
- `GET /api/polls/creator/:address` - Get creator polls

All endpoints should return responses in the format defined in the TypeScript interfaces.
