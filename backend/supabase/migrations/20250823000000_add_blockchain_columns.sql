-- Add blockchain-specific columns to polls table
-- Migration: Add blockchain_id and transaction_hash columns

-- Add blockchain_id column to store the smart contract poll ID
ALTER TABLE polls 
ADD COLUMN blockchain_id VARCHAR(50) NULL;

-- Add transaction_hash column to store the blockchain transaction hash
ALTER TABLE polls 
ADD COLUMN transaction_hash VARCHAR(66) NULL;

-- Add index for blockchain_id for better performance when querying blockchain polls
CREATE INDEX idx_polls_blockchain_id ON polls(blockchain_id);

-- Add index for transaction_hash for lookups
CREATE INDEX idx_polls_transaction_hash ON polls(transaction_hash);

-- Add index for is_on_chain to optimize filtering
CREATE INDEX idx_polls_is_on_chain ON polls(is_on_chain);

-- Update the existing RLS policies to handle blockchain polls
-- (Existing policies should work fine, but let's ensure they're comprehensive)

-- Comment: This migration adds support for storing blockchain poll metadata
-- blockchain_id: The ID of the poll on the smart contract
-- transaction_hash: The hash of the transaction that created the poll
