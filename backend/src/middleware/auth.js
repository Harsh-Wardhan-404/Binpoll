const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const config = require('../config/environment');
const { supabase } = require('../config/supabase');

// Generate avatar SVG for wallet address
const generateAvatarUrl = (address) => {
  const initials = address.slice(0, 4).toUpperCase();
  const colors = ['#f0b90b', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'];
  const color = colors[parseInt(address.slice(-1), 16) % colors.length];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
    <rect width="150" height="150" fill="${color}"/>
    <text x="75" y="85" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold">${initials}</text>
  </svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Wallet authentication handler
const authenticateWallet = async (req, res) => {
  const { address, message, signature } = req.body;

  try {
    // Validate input
    if (!address || !message || !signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: address, message, signature' 
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid signature' 
      });
    }

    // Check if user exists or create new user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database error:', userError);
      throw userError;
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: address.toLowerCase(),
          username: `User_${address.slice(0, 6)}`,
          avatar_url: generateAvatarUrl(address)
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        throw createError;
      }
      user = newUser;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        walletAddress: address.toLowerCase(),
        username: user.username
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        avatarUrl: user.avatar_url,
        totalPollsCreated: user.total_polls_created,
        totalVotesCast: user.total_votes_cast
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Middleware to verify JWT token
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username,
      avatarUrl: user.avatar_url
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (user) {
        req.user = {
          id: user.id,
          walletAddress: user.wallet_address,
          username: user.username,
          avatarUrl: user.avatar_url
        };
      }
    }
    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};

module.exports = {
  authenticateWallet,
  verifyAuth,
  optionalAuth,
  generateAvatarUrl
};
