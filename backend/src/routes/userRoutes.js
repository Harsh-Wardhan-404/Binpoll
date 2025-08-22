const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyAuth, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../helpers/asyncHandler');

// @desc    Get user profile with statistics
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', verifyAuth, asyncHandler(async (req, res) => {
  try {
    // Get user with poll and vote statistics
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return res.status(500).json({
        success: false,
        error: 'Error fetching user profile'
      });
    }

    // Get user's voting history
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        poll_id,
        option_index,
        vote_weight,
        voter_credibility_at_time,
        created_at
      `)
      .eq('voter_id', req.user.id)
      .order('created_at', { ascending: false });

    if (votesError) {
      console.error('Error fetching user votes:', votesError);
      return res.status(500).json({
        success: false,
        error: 'Error fetching user voting history'
      });
    }

    // Get user's polls separately
    const { data: userPolls, error: pollsError } = await supabase
      .from('polls')
      .select('id, title, created_at, end_time, is_active, total_votes')
      .eq('creator_id', req.user.id)
      .order('created_at', { ascending: false });

    if (pollsError) {
      console.error('Error fetching user polls:', pollsError);
      return res.status(500).json({
        success: false,
        error: 'Error fetching user polls'
      });
    }

    // Calculate statistics
    const activePolls = userPolls?.filter(poll => 
      poll.is_active && new Date(poll.end_time) > new Date()
    ) || [];
    
    const endedPolls = userPolls?.filter(poll => 
      !poll.is_active || new Date(poll.end_time) <= new Date()
    ) || [];

    const totalVotesCast = votes?.length || 0;
    const averageCredibility = votes?.length > 0 
      ? votes.reduce((sum, vote) => sum + vote.voter_credibility_at_time, 0) / votes.length 
      : user.credibility_score || 60;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          username: user.username,
          avatarUrl: user.avatar_url,
          credibilityScore: user.credibility_score,
          reputationLevel: user.reputation_level,
          successfulPredictions: user.successful_predictions,
          totalPredictions: user.total_predictions,
          totalPollsCreated: user.total_polls_created,
          totalVotesCast: user.total_votes_cast,
          lastActivity: user.last_activity,
          createdAt: user.created_at
        },
        statistics: {
          activePolls: activePolls.length,
          endedPolls: endedPolls.length,
          totalVotesCast,
          averageCredibility: parseFloat(averageCredibility.toFixed(2)),
          recentVotes: votes?.slice(0, 5) || []
        },
        activePolls: activePolls,
        endedPolls: endedPolls
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user profile'
    });
  }
}));

// @desc    Get users by credibility range
// @route   GET /api/users/credibility/:min/:max
// @access  Public
router.get('/credibility/:min/:max', optionalAuth, asyncHandler(async (req, res) => {
  const { min, max } = req.params;
  const minCredibility = parseFloat(min);
  const maxCredibility = parseFloat(max);

  if (isNaN(minCredibility) || isNaN(maxCredibility)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid credibility range'
    });
  }

  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      avatar_url,
      credibility_score,
      reputation_level,
      successful_predictions,
      total_predictions,
      total_polls_created,
      total_votes_cast
    `)
    .gte('credibility_score', minCredibility)
    .lte('credibility_score', maxCredibility)
    .order('credibility_score', { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
}));

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      avatar_url,
      credibility_score,
      reputation_level,
      successful_predictions,
      total_predictions,
      total_polls_created,
      total_votes_cast,
      created_at
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
}));

module.exports = router;
