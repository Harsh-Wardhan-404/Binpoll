const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { validateUser } = require('../helpers/validation');
const { asyncHandler } = require('../helpers/asyncHandler');

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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', req.params.id)
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

  const { account_address, user_name, photo_key } = req.body;

  const { data, error } = await supabase
    .from('users')
    .insert([{ account_address, user_name, photo_key }])
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
  const { user_name, photo_key } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ user_name, photo_key })
    .eq('user_id', req.params.id)
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
    .eq('user_id', req.params.id);

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

// @desc    Get user by account address
// @route   GET /api/users/address/:address
// @access  Public
router.get('/address/:address', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('account_address', req.params.address)
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

module.exports = router;
