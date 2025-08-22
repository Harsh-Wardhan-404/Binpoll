const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { validatePoll } = require('../helpers/validation');
const { asyncHandler } = require('../helpers/asyncHandler');

// @desc    Get all polls
// @route   GET /api/polls
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (user_id, user_name, account_address),
      poll_options (poll_option_id, option_text)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
}));

// @desc    Get single poll
// @route   GET /api/polls/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (user_id, user_name, account_address),
      poll_options (
        poll_option_id, 
        option_text,
        poll_options_voters (
          voter_id,
          comments,
          users:voter_id (user_name)
        )
      )
    `)
    .eq('poll_id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  res.status(200).json({
    success: true,
    data
  });
}));

// @desc    Create new poll
// @route   POST /api/polls
// @access  Public
router.post('/', asyncHandler(async (req, res) => {
  // Validate input
  const validation = validatePoll(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: validation.error.issues[0].message
    });
  }

  const {
    topic,
    description,
    creator_id,
    number_of_polls = 1,
    limits_per_poll = 1,
    creator_fee = 0,
    random_winner = 1,
    start_date,
    end_date
  } = req.body;

  const { data, error } = await supabase
    .from('polls')
    .insert([{
      topic,
      description,
      creator_id,
      number_of_polls,
      limits_per_poll,
      creator_fee,
      random_winner,
      start_date: start_date || new Date().toISOString(),
      end_date
    }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(201).json({
    success: true,
    data
  });
}));

// @desc    Update poll
// @route   PUT /api/polls/:id
// @access  Public
router.put('/:id', asyncHandler(async (req, res) => {
  const {
    topic,
    description,
    number_of_polls,
    limits_per_poll,
    creator_fee,
    random_winner,
    end_date
  } = req.body;

  const { data, error } = await supabase
    .from('polls')
    .update({
      topic,
      description,
      number_of_polls,
      limits_per_poll,
      creator_fee,
      random_winner,
      end_date
    })
    .eq('poll_id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found or update failed'
    });
  }

  res.status(200).json({
    success: true,
    data
  });
}));

// @desc    Delete poll
// @route   DELETE /api/polls/:id
// @access  Public
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('poll_id', req.params.id);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}));

// @desc    Get polls by creator
// @route   GET /api/polls/creator/:creatorId
// @access  Public
router.get('/creator/:creatorId', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (user_id, user_name, account_address),
      poll_options (poll_option_id, option_text)
    `)
    .eq('creator_id', req.params.creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
}));

// @desc    Get active polls
// @route   GET /api/polls/active
// @access  Public
router.get('/status/active', asyncHandler(async (req, res) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (user_id, user_name, account_address),
      poll_options (poll_option_id, option_text)
    `)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
}));

module.exports = router;
