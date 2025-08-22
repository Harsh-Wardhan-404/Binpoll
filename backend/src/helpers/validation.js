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

module.exports = {
  validateUser,
  validatePoll,
  validatePollOption,
  validateVote,
  userSchema,
  pollSchema,
  pollOptionSchema,
  voteSchema
};
