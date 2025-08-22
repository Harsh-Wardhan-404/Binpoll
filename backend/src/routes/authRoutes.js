const express = require('express');
const { authenticateWallet, verifyAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const router = express.Router();

// POST /api/auth/wallet - Authenticate with wallet signature
router.post('/wallet', authenticateWallet);

// GET /api/auth/me - Get current user profile
router.get('/me', verifyAuth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        avatarUrl: user.avatar_url,
        totalPollsCreated: user.total_polls_created,
        totalVotesCast: user.total_votes_cast,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user data' 
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyAuth, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters long'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        username: username.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile' 
    });
  }
});

// POST /api/auth/verify - Verify token validity
router.post('/verify', verifyAuth, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user
  });
});

module.exports = router;
