# Credibility System Documentation

## Overview

The credibility system is designed to create a more reliable and fair voting environment by tracking user prediction accuracy and implementing weighted voting based on credibility scores.

## Key Features

### 1. User Credibility Scoring
- **Initial Score**: 60% for all new users
- **Score Range**: 0-100%
- **Reputation Levels**:
  - Novice (0-54): New users
  - Apprentice (55-69): Basic experience
  - Expert (70-84): Proven track record
  - Master (85-94): High accuracy
  - Legend (95-100): Exceptional predictors

### 2. Credibility Changes
- **Correct Prediction**: +2 points
- **Incorrect Prediction**: -1 point
- **Score Bounds**: Cannot go below 0 or above 100

### 3. Poll Credibility Requirements
- **Minimum Credibility**: Poll creators can set a minimum credibility score required to vote
- **Credibility Gating**: Optional feature to restrict voting to users with sufficient credibility
- **Creator Bonus**: Poll creators can earn credibility bonuses for creating successful polls

### 4. Voting Limits
- **Maximum Voters**: Poll creators can set a limit on the number of participants
- **Current Voter Count**: Automatic tracking of current participants
- **Predictable Calculation**: Fixed limits ensure predictable outcomes

### 5. Weighted Voting
- **Vote Weight**: Each vote is weighted based on the voter's credibility score
- **Weight Multiplier**: Poll creators can set a multiplier to adjust voting weights
- **Formula**: `vote_weight = (credibility_score / 100) * weight_multiplier`
- **Bounds**: Vote weight is capped between 0.1 and 5.0

## Database Schema Changes

### Users Table Additions
```sql
credibility_score DECIMAL(5,2) DEFAULT 60.00
successful_predictions INTEGER DEFAULT 0
total_predictions INTEGER DEFAULT 0
reputation_level VARCHAR(20) DEFAULT 'Novice'
last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Polls Table Additions
```sql
min_credibility_required DECIMAL(5,2) DEFAULT 0.00
max_voters INTEGER DEFAULT NULL
current_voter_count INTEGER DEFAULT 0
is_credibility_gated BOOLEAN DEFAULT FALSE
voting_weight_multiplier DECIMAL(3,2) DEFAULT 1.00
creator_credibility_bonus DECIMAL(5,2) DEFAULT 0.00
```

### Votes Table Additions
```sql
voter_credibility_at_time DECIMAL(5,2) NOT NULL
vote_weight DECIMAL(8,4) DEFAULT 1.0000
credibility_earned DECIMAL(5,2) DEFAULT 0.00
is_correct_prediction BOOLEAN DEFAULT NULL
```

### New Tables
- **credibility_history**: Tracks all credibility changes with reasons
- **poll_results**: Stores final poll outcomes and statistics

## API Endpoints

### User Routes
- `GET /api/users/:id/credibility-history` - Get user's credibility change history
- `GET /api/users/credibility/:min/:max` - Get users by credibility range

### Poll Routes
- `GET /api/polls/credibility/:minCredibility` - Get polls by minimum credibility requirement
- `GET /api/polls/limited` - Get polls with voting limits
- `GET /api/polls/:id/results` - Get poll results with credibility analysis

### Poll Options Routes
- Updated to work with new array-based options system
- Includes credibility-weighted vote statistics

## Database Functions

### 1. `calculate_reputation_level(credibility_score)`
Automatically determines reputation level based on credibility score.

### 2. `update_user_credibility_after_poll()`
Trigger function that updates user credibility when poll results are determined.

### 3. `validate_voting_eligibility(poll_id, voter_id, voter_credibility)`
Checks if a user can vote on a specific poll based on:
- Poll activity status
- End time
- Minimum credibility requirement
- Maximum voter limit

### 4. `calculate_vote_weight(voter_credibility, poll_weight_multiplier)`
Calculates the weight of a vote based on credibility and poll settings.

### 5. `set_vote_metadata()`
Trigger function that sets vote metadata when a vote is created.

## Triggers

### 1. `trigger_set_vote_metadata`
- Fires before vote insertion
- Sets voter credibility at time of vote
- Calculates and sets vote weight
- Updates poll's current voter count

### 2. `trigger_update_credibility_after_poll`
- Fires when poll results are determined
- Updates user credibility based on prediction accuracy
- Records changes in credibility history
- Updates reputation levels

## Usage Examples

### Creating a Poll with Credibility Requirements
```javascript
const pollData = {
  title: "Will Bitcoin reach $100k in 2024?",
  description: "Predict Bitcoin's price movement",
  creator_id: "user-uuid",
  creator_address: "0x...",
  options: ["Yes", "No"],
  duration_hours: 168, // 7 days
  min_credibility_required: 70, // Only experts can vote
  max_voters: 100, // Limit to 100 participants
  voting_weight_multiplier: 1.5 // Give more weight to credible voters
};
```

### Voting with Credibility Check
```javascript
const voteData = {
  poll_id: "poll-uuid",
  voter_id: "user-uuid",
  voter_address: "0x...",
  option_index: 0,
  amount: 0.001
};

// System automatically:
// 1. Checks voter eligibility
// 2. Calculates vote weight based on credibility
// 3. Records voter credibility at time of vote
// 4. Updates poll statistics
```

### Getting Poll Results with Credibility Analysis
```javascript
// GET /api/polls/:id/results
// Returns:
{
  poll: { /* poll details */ },
  results: [
    {
      option: "Yes",
      optionIndex: 0,
      totalVotes: 45,
      totalWeight: 67.5,
      averageCredibility: 78.5,
      percentage: 65.2
    }
  ],
  totalVotes: 69,
  totalWeightedVotes: 103.5,
  averageCredibility: 75.2
}
```

## Benefits

1. **Quality Control**: Higher credibility users have more influence
2. **Spam Prevention**: Credibility requirements deter low-quality participation
3. **Fairness**: Weighted voting ensures accurate users have more impact
4. **Transparency**: All credibility changes are tracked and visible
5. **Gamification**: Users are motivated to improve their prediction accuracy
6. **Predictability**: Fixed voting limits ensure manageable poll sizes

## Migration

To apply these changes:

1. Run the migration: `npx supabase db push`
2. Update existing users with default credibility scores
3. Test the new API endpoints
4. Monitor credibility changes and system performance

## Future Enhancements

- **Credibility Decay**: Gradual decrease in credibility over time
- **Category-Specific Credibility**: Different scores for different poll categories
- **Social Features**: Users can follow high-credibility predictors
- **Rewards System**: Incentives for maintaining high credibility
- **Advanced Analytics**: Detailed credibility trend analysis
