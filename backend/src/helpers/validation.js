const { z } = require('zod');

// User validation schema
const userSchema = z.object({
  account_address: z.string()
    .min(42, 'Account address must be exactly 42 characters')
    .max(42, 'Account address must be exactly 42 characters')
    .startsWith('0x', 'Account address must start with 0x'),
  user_name: z.string()
    .min(1, 'Username is required')
    .max(100, 'Username cannot exceed 100 characters'),
  photo_key: z.string().optional()
});

// Poll validation schema
const pollSchema = z.object({
  topic: z.string()
    .min(1, 'Topic is required')
    .max(200, 'Topic cannot exceed 200 characters'),
  description: z.string().optional(),
  creator_id: z.string().uuid('Invalid creator ID format'),
  number_of_polls: z.number().int().positive().optional().default(1),
  limits_per_poll: z.number().int().positive().optional().default(1),
  creator_fee: z.number().min(0, 'Creator fee cannot be negative').optional().default(0),
  random_winner: z.number().int().min(1).max(3).optional().default(1),
  start_date: z.string().optional(),
  end_date: z.string().min(1, 'End date is required')
});

// Poll option validation schema
const pollOptionSchema = z.object({
  poll_id: z.string().uuid('Invalid poll ID format'),
  option_text: z.string()
    .min(1, 'Option text is required')
    .max(500, 'Option text cannot exceed 500 characters')
});

// Vote validation schema
const voteSchema = z.object({
  voter_id: z.string().uuid('Invalid voter ID format'),
  comments: z.string().optional()
});

// Validation functions
const validateUser = (data) => {
  try {
    const validatedData = userSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    return { success: false, error };
  }
};

const validatePoll = (data) => {
  try {
    const validatedData = pollSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    return { success: false, error };
  }
};

const validatePollOption = (data) => {
  try {
    const validatedData = pollOptionSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    return { success: false, error };
  }
};

const validateVote = (data) => {
  try {
    const validatedData = voteSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    return { success: false, error };
  }
};

// Validate poll creation with credibility features
const validatePollWithCredibility = (data) => {
  const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
    creator_id: z.string().uuid('Invalid creator ID'),
    creator_address: z.string().length(42, 'Invalid wallet address'),
    options: z.array(z.string().min(1, 'Option text is required').max(500, 'Option text must be less than 500 characters'))
      .min(2, 'At least 2 options are required')
      .max(10, 'Maximum 10 options allowed'),
    category: z.string().optional().default('General'),
    duration_hours: z.number().int().min(1, 'Duration must be at least 1 hour').max(8760, 'Duration cannot exceed 1 year'),
    min_credibility_required: z.number().min(0, 'Minimum credibility cannot be negative').max(100, 'Minimum credibility cannot exceed 100').optional().default(0),
    max_voters: z.number().int().min(1, 'Maximum voters must be at least 1').optional(),
    voting_weight_multiplier: z.number().min(0.1, 'Weight multiplier must be at least 0.1').max(5.0, 'Weight multiplier cannot exceed 5.0').optional().default(1.0),
    creator_credibility_bonus: z.number().min(0, 'Creator bonus cannot be negative').max(10, 'Creator bonus cannot exceed 10').optional().default(0)
  });

  return schema.safeParse(data);
};

// Validate vote with credibility checks
const validateVoteWithCredibility = (data) => {
  const schema = z.object({
    poll_id: z.string().uuid('Invalid poll ID'),
    voter_id: z.string().uuid('Invalid voter ID'),
    voter_address: z.string().length(42, 'Invalid wallet address'),
    option_index: z.number().int().min(0, 'Option index must be non-negative'),
    amount: z.number().min(0.001, 'Amount must be at least 0.001').optional().default(0.001),
    tx_hash: z.string().optional()
  });

  return schema.safeParse(data);
};

// Validate credibility score update
const validateCredibilityUpdate = (data) => {
  const schema = z.object({
    user_id: z.string().uuid('Invalid user ID'),
    new_score: z.number().min(0, 'Credibility score cannot be negative').max(100, 'Credibility score cannot exceed 100'),
    reason: z.string().min(1, 'Reason is required').max(100, 'Reason must be less than 100 characters')
  });

  return schema.safeParse(data);
};

module.exports = {
  validateUser,
  validatePoll,
  validatePollOption,
  validateVote,
  validatePollWithCredibility,
  validateVoteWithCredibility,
  validateCredibilityUpdate,
  userSchema,
  pollSchema,
  pollOptionSchema,
  voteSchema
};
