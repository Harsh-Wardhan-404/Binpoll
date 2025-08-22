const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { validateUser } = require('../helpers/validation');
const { asyncHandler } = require('../helpers/asyncHandler');
const { verifyAuth } = require('../middleware/auth');
const { ethers } = require('ethers');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
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

// @desc    Get user profile with balance and stats
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', verifyAuth, asyncHandler(async (req, res) => {
  console.log('=== PROFILE ENDPOINT HIT ==='); // This should always show
  try {
    console.log('Profile request - req.user:', req.user); // Debug log
    
    // First try to get user by ID from the auth token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      console.error('Database error:', userError);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }

    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's polls
    const { data: userPolls, error: pollsError } = await supabase
      .from('polls')
      .select('id, title, created_at')
      .eq('creator_address', user.wallet_address.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(5);

    // Get user's votes
    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select('id, poll_id, amount, created_at, polls(title)')
      .eq('voter_address', user.wallet_address.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(5);

    // Get BNB balance from blockchain
    let bnbBalance = '0';
    let usdBalance = '0';
    
    try {
      // Use BSC Testnet RPC
      const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
      const balance = await provider.getBalance(user.wallet_address);
      bnbBalance = ethers.formatEther(balance);
      
      // For demo purposes, use a fixed USD rate (in production, use a price API)
      const bnbPrice = 300; // USD per BNB (you should fetch this from an API)
      usdBalance = (parseFloat(bnbBalance) * bnbPrice).toFixed(2);
    } catch (blockchainError) {
      console.error('Error fetching blockchain balance:', blockchainError);
      // Use fallback values if blockchain call fails
      bnbBalance = '0.0';
      usdBalance = '0.00';
    }

    // Calculate total earnings from votes
    const totalEarnings = userVotes?.reduce((sum, vote) => {
      return sum + parseFloat(vote.amount || '0');
    }, 0) || 0;

    // Determine user rank based on activity
    let rank = 'Novice';
    if (user.total_polls_created > 10 || user.total_votes_cast > 50) {
      rank = 'Expert';
    } else if (user.total_polls_created > 5 || user.total_votes_cast > 20) {
      rank = 'Intermediate';
    }

    // Build recent activity
    const recentActivity = [];
    
    // Add recent polls
    if (userPolls) {
      userPolls.forEach(poll => {
        recentActivity.push({
          id: poll.id,
          type: 'poll_created',
          title: poll.title,
          timestamp: poll.created_at
        });
      });
    }

    // Add recent votes
    if (userVotes) {
      userVotes.forEach(vote => {
        recentActivity.push({
          id: vote.id,
          type: 'vote_cast',
          title: `Voted on: ${vote.polls?.title || 'Unknown Poll'}`,
          timestamp: vote.created_at,
          amount: vote.amount
        });
      });
    }

    // Sort by timestamp and take top 5
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentActivity.splice(5);

    const profileData = {
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username,
      avatarUrl: user.avatar_url || '',
      totalPollsCreated: user.total_polls_created || 0,
      totalVotesCast: user.total_votes_cast || 0,
      balance: {
        bnb: bnbBalance,
        usd: usdBalance
      },
      stats: {
        pollsCreated: user.total_polls_created || 0,
        votesCast: user.total_votes_cast || 0,
        totalEarnings: totalEarnings.toFixed(4),
        rank: rank
      },
      recentActivity: recentActivity
    };

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
}));

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data
  });
}));

// @desc    Create new user
// @route   POST /api/users
// @access  Public
router.post('/', asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateUser(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: validation.error.issues[0].message
    });
  }

  const { wallet_address, username, avatar_url } = req.body;

  const { data, error } = await supabase
    .from('users')
    .insert([{ 
      wallet_address, 
      username, 
      avatar_url,
      credibility_score: 60.00, // Default credibility for new users
      reputation_level: 'Novice'
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
router.put('/:id', asyncHandler(async (req, res) => {
  const { username, avatar_url } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ username, avatar_url })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      error: 'User not found or update failed'
    });
  }

  res.status(200).json({
    success: true,
    data
  });
}));

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id);

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

// @desc    Get user by wallet address
// @route   GET /api/users/address/:address
// @access  Public
router.get('/address/:address', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', req.params.address)
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data
  });
}));



// @desc    Get users by credibility score range
// @route   GET /api/users/credibility/:min/:max
// @access  Public
router.get('/credibility/:min/:max', asyncHandler(async (req, res) => {
  const { min, max } = req.params;
  
  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, credibility_score, reputation_level, total_polls_created, total_votes_cast')
    .gte('credibility_score', parseFloat(min))
    .lte('credibility_score', parseFloat(max))
    .order('credibility_score', { ascending: false });

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

// @desc    Get user profile with balance and stats
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', verifyAuth, asyncHandler(async (req, res) => {
  console.log('=== PROFILE ENDPOINT HIT ==='); // This should always show
  try {
    console.log('Profile request - req.user:', req.user); // Debug log
    
    // First try to get user by ID from the auth token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      console.error('Database error:', userError);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }

    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's polls
    const { data: userPolls, error: pollsError } = await supabase
      .from('polls')
      .select('id, title, created_at')
      .eq('creator_address', user.wallet_address.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(5);

    // Get user's votes
    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select('id, poll_id, amount, created_at, polls(title)')
      .eq('voter_address', user.wallet_address.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(5);

    // Get BNB balance from blockchain
    let bnbBalance = '0';
    let usdBalance = '0';
    
    try {
      // Use BSC Testnet RPC
      const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
      const balance = await provider.getBalance(user.wallet_address);
      bnbBalance = ethers.formatEther(balance);
      
      // For demo purposes, use a fixed USD rate (in production, use a price API)
      const bnbPrice = 300; // USD per BNB (you should fetch this from an API)
      usdBalance = (parseFloat(bnbBalance) * bnbPrice).toFixed(2);
    } catch (blockchainError) {
      console.error('Error fetching blockchain balance:', blockchainError);
      // Use fallback values if blockchain call fails
      bnbBalance = '0.0';
      usdBalance = '0.00';
    }

    // Calculate total earnings from votes
    const totalEarnings = userVotes?.reduce((sum, vote) => {
      return sum + parseFloat(vote.amount || '0');
    }, 0) || 0;

    // Determine user rank based on activity
    let rank = 'Novice';
    if (user.total_polls_created > 10 || user.total_votes_cast > 50) {
      rank = 'Expert';
    } else if (user.total_polls_created > 5 || user.total_votes_cast > 20) {
      rank = 'Intermediate';
    }

    // Build recent activity
    const recentActivity = [];
    
    // Add recent polls
    if (userPolls) {
      userPolls.forEach(poll => {
        recentActivity.push({
          id: poll.id,
          type: 'poll_created',
          title: poll.title,
          timestamp: poll.created_at
        });
      });
    }

    // Add recent votes
    if (userVotes) {
      userVotes.forEach(vote => {
        recentActivity.push({
          id: vote.id,
          type: 'vote_cast',
          title: `Voted on: ${vote.polls?.title || 'Unknown Poll'}`,
          timestamp: vote.created_at,
          amount: vote.amount
        });
      });
    }

    // Sort by timestamp and take top 5
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentActivity.splice(5);

    const profileData = {
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username,
      avatarUrl: user.avatar_url || '',
      totalPollsCreated: user.total_polls_created || 0,
      totalVotesCast: user.total_votes_cast || 0,
      balance: {
        bnb: bnbBalance,
        usd: usdBalance
      },
      stats: {
        pollsCreated: user.total_polls_created || 0,
        votesCast: user.total_votes_cast || 0,
        totalEarnings: totalEarnings.toFixed(4),
        rank: rank
      },
      recentActivity: recentActivity
    };

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
}));

// @desc    Test authentication endpoint
// @route   GET /api/users/test-auth
// @access  Private
router.get('/test-auth', verifyAuth, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    user: req.user
  });
}));

module.exports = router;
