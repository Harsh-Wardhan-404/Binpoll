const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyAuth, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../helpers/asyncHandler');

// @desc    Get all polls
// @route   GET /api/polls
// @access  Public
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, search, status } = req.query;
  const offset = (page - 1) * limit;

  // If no category/search filter, return recents, hots, large_bets
  if ((!category || category === 'All') && !search) {
    // Recents: sorted by created_at desc
    let recentsQuery = supabase
      .from('polls')
      .select(`
        *,
        users:creator_id (id, username, wallet_address, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    // Hots: sorted by total_votes desc
    let hotsQuery = supabase
      .from('polls')
      .select(`
        *,
        users:creator_id (id, username, wallet_address, avatar_url)
      `)
      .order('total_votes', { ascending: false })
      .range(0, limit - 1);

    // Large Bets: sorted by total_pool desc
    let largeBetsQuery = supabase
      .from('polls')
      .select(`
        *,
        users:creator_id (id, username, wallet_address, avatar_url)
      `)
      .order('total_pool', { ascending: false })
      .range(0, limit - 1);

    // Run all queries in parallel
    const [recentsRes, hotsRes, largeBetsRes] = await Promise.all([
      recentsQuery,
      hotsQuery,
      largeBetsQuery
    ]);

    // Helper to add optionVotes and userVote
    async function enrichPolls(polls) {
      return Promise.all(
        (polls || []).map(async (poll) => {
          const { data: votes } = await supabase
            .from('votes')
            .select('option_index, voter_address')
            .eq('poll_id', poll.id);

          const optionVotes = poll.options.map((_, index) => {
            return votes ? votes.filter(vote => vote.option_index === index).length : 0;
          });

          let userVote = null;
          if (req.user && votes) {
            const userVoteRecord = votes.find(vote =>
              vote.voter_address && vote.voter_address.toLowerCase() === req.user.walletAddress.toLowerCase()
            );
            if (userVoteRecord) {
              userVote = userVoteRecord.option_index;
            }
          }

          return {
            ...poll,
            optionVotes,
            totalVotes: votes ? votes.length : 0,
            userVote
          };
        })
      );
    }

    const recents = await enrichPolls(recentsRes.data);
    const hots = await enrichPolls(hotsRes.data);
    const large_bets = await enrichPolls(largeBetsRes.data);

    return res.status(200).json({
      success: true,
      data: {
        recents,
        hots,
        large_bets
      }
    });
  }

  let query = supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (id, username, wallet_address, avatar_url)
    `)
    .order('created_at', { ascending: false });

  // Add filters
  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (status === 'active') {
    query = query.eq('is_active', true).gte('end_time', new Date().toISOString());
  } else if (status === 'ended') {
    query = query.lt('end_time', new Date().toISOString());
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // Get vote counts for each poll
  const pollsWithVotes = await Promise.all(
    data.map(async (poll) => {
      const { data: votes } = await supabase
        .from('votes')
        .select('option_index, voter_address')
        .eq('poll_id', poll.id);

      const optionVotes = poll.options.map((_, index) => {
        return votes ? votes.filter(vote => vote.option_index === index).length : 0;
      });

      // Check if authenticated user has voted on this poll
      let userVote = null;
      if (req.user && votes) {
        const userVoteRecord = votes.find(vote => 
          vote.voter_address && vote.voter_address.toLowerCase() === req.user.walletAddress.toLowerCase()
        );
        if (userVoteRecord) {
          userVote = userVoteRecord.option_index;
        }
      }

      return {
        ...poll,
        optionVotes,
        totalVotes: votes ? votes.length : 0,
        userVote
      };
    })
  );

  res.status(200).json({
    success: true,
    count: pollsWithVotes.length,
    data: pollsWithVotes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count
    }
  });
}));

// @desc    Get single poll
// @route   GET /api/polls/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { data: poll, error } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (id, username, wallet_address, avatar_url)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  // Get votes for this poll
  const { data: votes } = await supabase
    .from('votes')
    .select('option_index, voter_address, amount, created_at')
    .eq('poll_id', poll.id)
    .order('created_at', { ascending: false });

  // Calculate vote counts and percentages
  const optionVotes = poll.options.map((_, index) => {
    return votes ? votes.filter(vote => vote.option_index === index).length : 0;
  });

  const totalVotes = votes ? votes.length : 0;
  const optionPercentages = optionVotes.map(count => 
    totalVotes > 0 ? (count / totalVotes) * 100 : 0
  );

  // Check if user has voted (if authenticated)
  let userVote = null;
  if (req.user && votes) {
    const userVoteRecord = votes.find(vote => 
      vote.voter_address.toLowerCase() === req.user.walletAddress.toLowerCase()
    );
    if (userVoteRecord) {
      userVote = userVoteRecord.option_index;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      ...poll,
      optionVotes,
      optionPercentages,
      totalVotes,
      userVote,
      isActive: new Date(poll.end_time) > new Date() && poll.is_active
    }
  });
}));

// @desc    Create new poll
// @route   POST /api/polls
// @access  Private
router.post('/', verifyAuth, asyncHandler(async (req, res) => {
  const {
    title,
    description,
    options,
    durationMinutes,
    category = 'General'
  } = req.body;

  // Validate input
  if (!title || !description || !options || !durationMinutes) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, description, options, durationMinutes'
    });
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 5) {
    return res.status(400).json({
      success: false,
      error: 'Options must be an array with 2-5 items'
    });
  }

  if (durationMinutes < 0.5 || durationMinutes > 43200) {
    return res.status(400).json({
      success: false,
      error: 'Duration must be between 30 seconds (0.5 minutes) and 30 days (43200 minutes)'
    });
  }

  const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      title: title.trim(),
      description: description.trim(),
      creator_id: req.user.id,
      creator_address: req.user.walletAddress,
      options: options.map(opt => opt.trim()),
      category,
      duration_hours: Math.max(1, Math.round(durationMinutes / 60)), // Convert minutes to hours, minimum 1 hour for DB
      end_time: endTime.toISOString(),
      is_active: true,
      total_votes: 0,
      total_pool: '0',
      is_on_chain: false
    })
    .select(`
      *,
      users:creator_id (id, username, wallet_address, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Poll creation error:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // Update user's poll count
  await supabase
    .from('users')
    .update({
      total_polls_created: req.user.totalPollsCreated + 1
    })
    .eq('id', req.user.id);

  res.status(201).json({
    success: true,
    data: {
      ...poll,
      optionVotes: poll.options.map(() => 0),
      optionPercentages: poll.options.map(() => 0),
      totalVotes: 0
    }
  });
}));

// @desc    Create new blockchain poll
// @route   POST /api/polls/blockchain
// @access  Private
router.post('/blockchain', verifyAuth, asyncHandler(async (req, res) => {
  const {
    title,
    description,
    options,
    durationMinutes,
    category = 'Blockchain',
    blockchainId,
    transactionHash,
    creatorAddress,
    totalPool
  } = req.body;

  // Validate input
  if (!title || !description || !options || durationMinutes === undefined || durationMinutes === null || !blockchainId || !transactionHash || !creatorAddress) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, description, options, durationMinutes, blockchainId, transactionHash, creatorAddress'
    });
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 5) {
    return res.status(400).json({
      success: false,
      error: 'Options must be an array with 2-5 items'
    });
  }

  if (durationMinutes < 0.5 || durationMinutes > 43200) {
    return res.status(400).json({
      success: false,
      error: 'Duration must be between 30 seconds (0.5 minutes) and 30 days (43200 minutes)'
    });
  }

  const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      title: title.trim(),
      description: description.trim(),
      creator_id: req.user.id,
      creator_address: req.user.walletAddress,
      options: options.map(opt => opt.trim()),
      category,
      duration_hours: Math.max(1, Math.round(durationMinutes / 60)), // Convert minutes to hours, minimum 1 hour for DB
      end_time: endTime.toISOString(),
      is_active: true,
      total_votes: 0,
      total_pool: totalPool || '0',
      is_on_chain: true,
      blockchain_id: blockchainId,
      transaction_hash: transactionHash
    })
    .select(`
      *,
      users (username, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating blockchain poll:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create blockchain poll',
      details: error.message
    });
  }

  // Transform the response to match frontend expectations
  const transformedPoll = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    options: poll.options.map((option, index) => ({
      text: option,
      votes: 0,
      percentage: 0
    })),
    category: poll.category,
    end_time: poll.end_time,
    is_active: poll.is_active,
    total_votes: poll.total_votes,
    optionVotes: new Array(poll.options.length).fill(0),
    totalVotes: poll.total_votes,
    users: poll.users,
    blockchain_id: poll.blockchain_id,
    transaction_hash: poll.transaction_hash,
    creator_address: poll.creator_address,
    total_pool: poll.total_pool
  };

  res.status(201).json({
    success: true,
    data: transformedPoll
  });
}));

// @desc    Vote on a poll
// @route   POST /api/polls/:id/vote
// @access  Private
router.post('/:id/vote', verifyAuth, asyncHandler(async (req, res) => {
  const { optionIndex, amount = '0.001' } = req.body;
  const pollId = req.params.id;

  // Validate input
  if (optionIndex === undefined || optionIndex < 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid option index is required'
    });
  }

  // Get poll
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  // Check if poll is active
  if (!poll.is_active || new Date(poll.end_time) <= new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Poll is not active or has ended'
    });
  }

  // Check if option index is valid
  if (optionIndex >= poll.options.length) {
    return res.status(400).json({
      success: false,
      error: 'Invalid option index'
    });
  }

  // Check if user has already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('voter_address', req.user.walletAddress)
    .single();

  if (existingVote) {
    return res.status(400).json({
      success: false,
      error: 'You have already voted on this poll'
    });
  }

  // Create vote record
  const { data: vote, error: voteError } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      voter_id: req.user.id,
      voter_address: req.user.walletAddress,
      option_index: optionIndex,
      amount,
      is_on_chain: false
    })
    .select()
    .single();

  if (voteError) {
    console.error('Vote creation error:', voteError);
    return res.status(400).json({
      success: false,
      error: voteError.message
    });
  }

  // Update poll vote count and total pool
  const { data: updatedPoll } = await supabase
    .from('polls')
    .update({
      total_votes: poll.total_votes + 1,
      total_pool: (parseFloat(poll.total_pool) + parseFloat(amount)).toString()
    })
    .eq('id', pollId)
    .select()
    .single();

  // Update user's vote count
  await supabase
    .from('users')
    .update({
      total_votes_cast: req.user.totalVotesCast + 1
    })
    .eq('id', req.user.id);

  res.status(201).json({
    success: true,
    data: {
      vote,
      poll: updatedPoll
    }
  });
}));

// @desc    Manually trigger settlement for a blockchain poll (for testing/admin)
// @route   POST /api/polls/:id/manual-settle
// @access  Public (for testing purposes)
router.post('/:id/manual-settle', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    // Check if poll has ended
    const pollEndTime = new Date(poll.end_time || poll.endDate);
    if (new Date() < pollEndTime) {
      return res.status(400).json({
        success: false,
        error: 'Poll has not ended yet'
      });
    }

    // Check if already settled
    if (poll.settled) {
      return res.status(400).json({
        success: false,
        error: 'Poll already settled'
      });
    }

    // Get all votes for this poll
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('option_index, voter_address')
      .eq('poll_id', id);

    if (votesError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch votes'
      });
    }

    // Count votes for each option
    const voteCounts = {};
    poll.options.forEach((_, index) => {
      voteCounts[index] = 0;
    });

    votes.forEach(vote => {
      if (voteCounts[vote.option_index] !== undefined) {
        voteCounts[vote.option_index]++;
      }
    });

    // Find the winning option (most votes)
    let winningOption = 0;
    let maxVotes = 0;
    
    Object.entries(voteCounts).forEach(([optionIndex, voteCount]) => {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        winningOption = parseInt(optionIndex);
      }
    });

    // Update poll as settled
    const { error: updateError } = await supabase
      .from('polls')
      .update({
        settled: true,
        winning_option: winningOption,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update poll status'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Poll automatically settled',
      data: {
        pollId: id,
        winningOption,
        totalVotes: votes.length,
        voteCounts
      }
    });

  } catch (error) {
    console.error('Auto-settlement error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during auto-settlement'
    });
    }
}));

// @desc    Vote on a blockchain poll
// @route   POST /api/polls/:id/vote/blockchain
// @access  Private
router.post('/:id/vote/blockchain', verifyAuth, asyncHandler(async (req, res) => {
  const { optionIndex, transactionHash, amount = '0.001' } = req.body;
  const pollIdParam = req.params.id;

  // Validate input
  if (optionIndex === undefined || optionIndex < 0 || !transactionHash) {
    return res.status(400).json({
      success: false,
      error: 'Valid option index and transaction hash are required'
    });
  }

  // Find poll by UUID (we now use database UUIDs as poll IDs)
  console.log('🔍 Looking for poll with UUID:', pollIdParam);
  
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollIdParam)
    .single();

  if (pollError || !poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  // Check if poll is blockchain poll
  if (!poll.is_on_chain) {
    return res.status(400).json({
      success: false,
      error: 'This is not a blockchain poll'
    });
  }

  // Check if poll is active
  if (!poll.is_active || new Date(poll.end_time) <= new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Poll is not active or has ended'
    });
  }

  // Check if option index is valid
  if (optionIndex >= poll.options.length) {
    return res.status(400).json({
      success: false,
      error: 'Invalid option index'
    });
  }

  console.log('✅ Found poll for voting:', poll.id, poll.title);

  // Check if user has already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', poll.id)  // Use the actual database poll ID
    .eq('voter_address', req.user.walletAddress)
    .single();

    console.log('🔍 Existing vote:', existingVote);

  if (existingVote) {
    return res.status(400).json({
      success: false,
      error: 'You have already voted on this poll'
    });
  }

  // Create blockchain vote record
  const { data: vote, error: voteError } = await supabase
    .from('votes')
    .insert({
      poll_id: poll.id,  // Use the actual database poll ID
      voter_id: req.user.id,
      voter_address: req.user.walletAddress,
      option_index: optionIndex,
      amount,
      tx_hash: transactionHash,
      is_on_chain: true
    })
    .select()
    .single();

  if (voteError) {
    console.error('Blockchain vote creation error:', voteError);
    return res.status(400).json({
      success: false,
      error: voteError.message
    });
  }

  // Update poll vote count and total pool
  const { data: updatedPoll } = await supabase
    .from('polls')
    .update({
      total_votes: poll.total_votes + 1,
      total_pool: (parseFloat(poll.total_pool) + parseFloat(amount)).toString()
    })
    .eq('id', poll.id)  // Use the actual database poll ID
    .select()
    .single();

  // Update user's vote count
  await supabase
    .from('users')
    .update({
      total_votes_cast: req.user.totalVotesCast + 1
    })
    .eq('id', req.user.id);

  res.status(201).json({
    success: true,
    data: {
      vote,
      poll: updatedPoll,
      transactionHash
    }
  });
}));

// @desc    Get polls by creator
// @route   GET /api/polls/creator/:creatorAddress
// @access  Public
router.get('/creator/:creatorAddress', optionalAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (id, username, wallet_address, avatar_url)
    `)
    .eq('creator_address', req.params.creatorAddress.toLowerCase())
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

// @desc    Get user's votes
// @route   GET /api/polls/my-votes
// @access  Private
router.get('/my-votes', verifyAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('votes')
    .select(`
      *,
      polls (
        id,
        title,
        options,
        end_time,
        is_active,
        users:creator_id (username, wallet_address)
      )
    `)
    .eq('voter_id', req.user.id)
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

// @desc    Get polls by minimum credibility requirement
// @route   GET /api/polls/credibility/:minCredibility
// @access  Public
router.get('/credibility/:minCredibility', optionalAuth, asyncHandler(async (req, res) => {
  const { minCredibility } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (id, username, wallet_address, avatar_url, credibility_score)
    `)
    .gte('min_credibility_required', parseFloat(minCredibility))
    .eq('is_active', true)
    .gte('end_time', new Date().toISOString())
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
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count
    }
  });
}));

// @desc    Get polls with voting limits
// @route   GET /api/polls/limited
// @access  Public
router.get('/limited', optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (id, username, wallet_address, avatar_url)
    `)
    .not('max_voters', 'is', null)
    .eq('is_active', true)
    .gte('end_time', new Date().toISOString())
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
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count
    }
  });
}));

// @desc    Get poll results with credibility analysis
// @route   GET /api/polls/:id/results
// @access  Public
router.get('/:id/results', optionalAuth, asyncHandler(async (req, res) => {
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(`
      *,
      users:creator_id (id, username, wallet_address, avatar_url)
    `)
    .eq('id', req.params.id)
    .single();

  if (pollError || !poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  // Get votes with credibility information
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select(`
      option_index,
      vote_weight,
      voter_credibility_at_time,
      users:voter_id (username, avatar_url, credibility_score)
    `)
    .eq('poll_id', req.params.id);

  if (votesError) {
    return res.status(400).json({
      success: false,
      error: votesError.message
    });
  }

  // Calculate weighted results
  const optionResults = poll.options.map((option, index) => {
    const optionVotes = votes.filter(vote => vote.option_index === index);
    const totalWeight = optionVotes.reduce((sum, vote) => sum + parseFloat(vote.vote_weight), 0);
    const totalVotes = optionVotes.length;
    const averageCredibility = optionVotes.length > 0 
      ? optionVotes.reduce((sum, vote) => sum + vote.voter_credibility_at_time, 0) / optionVotes.length 
      : 0;

    return {
      option: option,
      optionIndex: index,
      totalVotes,
      totalWeight,
      averageCredibility: parseFloat(averageCredibility.toFixed(2)),
      percentage: votes.length > 0 ? parseFloat(((totalWeight / votes.reduce((sum, v) => sum + parseFloat(v.vote_weight), 0)) * 100).toFixed(2)) : 0
    };
  });

  // Get poll result if available
  const { data: pollResult } = await supabase
    .from('poll_results')
    .select('*')
    .eq('poll_id', req.params.id)
    .single();

  res.status(200).json({
    success: true,
    data: {
      poll,
      results: optionResults,
      totalVotes: votes.length,
      totalWeightedVotes: votes.reduce((sum, vote) => sum + parseFloat(vote.vote_weight), 0),
      averageCredibility: votes.length > 0 
        ? parseFloat((votes.reduce((sum, vote) => sum + vote.voter_credibility_at_time, 0) / votes.length).toFixed(2))
        : 0,
      pollResult
    }
  });
}));

module.exports = router;