const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { validatePollOption, validateVote } = require('../helpers/validation');
const { asyncHandler } = require('../helpers/asyncHandler');

// @desc    Get all poll options for a specific poll
// @route   GET /api/poll-options/poll/:pollId
// @access  Public
router.get('/poll/:pollId', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('poll_options')
    .select(`
      *,
      polls (poll_id, topic),
      poll_options_voters (
        voter_id,
        comments,
        users:voter_id (user_name)
      )
    `)
    .eq('poll_id', req.params.pollId)
    .order('created_at', { ascending: true });

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

// @desc    Get single poll option
// @route   GET /api/poll-options/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('poll_options')
    .select(`
      *,
      polls (poll_id, topic),
      poll_options_voters (
        voter_id,
        comments,
        created_at,
        users:voter_id (user_name, account_address)
      )
    `)
    .eq('poll_option_id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      error: 'Poll option not found'
    });
  }

  res.status(200).json({
    success: true,
    data
  });
}));

// @desc    Create new poll option
// @route   POST /api/poll-options
// @access  Public
router.post('/', asyncHandler(async (req, res) => {
  // Validate input
  const validation = validatePollOption(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: validation.error.issues[0].message
    });
  }

  const { poll_id, option_text } = req.body;

  const { data, error } = await supabase
    .from('poll_options')
    .insert([{ poll_id, option_text }])
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

// @desc    Update poll option
// @route   PUT /api/poll-options/:id
// @access  Public
router.put('/:id', asyncHandler(async (req, res) => {
  const { option_text } = req.body;

  const { data, error } = await supabase
    .from('poll_options')
    .update({ option_text })
    .eq('poll_option_id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      error: 'Poll option not found or update failed'
    });
  }

  res.status(200).json({
    success: true,
    data
  });
}));

// @desc    Delete poll option
// @route   DELETE /api/poll-options/:id
// @access  Public
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('poll_options')
    .delete()
    .eq('poll_option_id', req.params.id);

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

// @desc    Vote for a poll option
// @route   POST /api/poll-options/:id/vote
// @access  Public
router.post('/:id/vote', asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateVote(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: validation.error.issues[0].message
    });
  }

  const { voter_id, comments } = req.body;
  const poll_option_id = req.params.id;

  // Check if user has already voted for this option
  const { data: existingVote } = await supabase
    .from('poll_options_voters')
    .select('*')
    .eq('poll_option_id', poll_option_id)
    .eq('voter_id', voter_id)
    .single();

  if (existingVote) {
    return res.status(400).json({
      success: false,
      error: 'User has already voted for this option'
    });
  }

  const { data, error } = await supabase
    .from('poll_options_voters')
    .insert([{ poll_option_id, voter_id, comments }])
    .select(`
      *,
      poll_options (option_text, poll_id),
      users:voter_id (user_name, account_address)
    `)
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

// @desc    Remove vote from poll option
// @route   DELETE /api/poll-options/:id/vote/:voterId
// @access  Public
router.delete('/:id/vote/:voterId', asyncHandler(async (req, res) => {
  const { id: poll_option_id, voterId: voter_id } = req.params;

  const { error } = await supabase
    .from('poll_options_voters')
    .delete()
    .eq('poll_option_id', poll_option_id)
    .eq('voter_id', voter_id);

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

// @desc    Get votes for a poll option
// @route   GET /api/poll-options/:id/votes
// @access  Public
router.get('/:id/votes', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('poll_options_voters')
    .select(`
      *,
      users:voter_id (user_name, account_address)
    `)
    .eq('poll_option_id', req.params.id)
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
