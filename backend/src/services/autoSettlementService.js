const cron = require('node-cron');
const { supabase } = require('../config/database');

class AutoSettlementService {
  constructor() {
    this.isRunning = false;
  }

  // Start the cron job to check for polls that need settlement
  start() {
    if (this.isRunning) {
      console.log('🔄 Auto-settlement service already running');
      return;
    }

    // Run every minute to check for polls that have ended
    cron.schedule('* * * * *', async () => {
      await this.checkAndSettlePolls();
    });

    this.isRunning = true;
    console.log('🚀 Auto-settlement service started - checking every minute');
  }

  // Stop the cron job
  stop() {
    this.isRunning = false;
    console.log('⏹️ Auto-settlement service stopped');
  }

  // Check for polls that need settlement and settle them automatically
  async checkAndSettlePolls() {
    try {
      console.log('🔍 Checking for polls that need automatic settlement...');

      // Find polls that have ended but haven't been settled
      const { data: pollsToSettle, error } = await supabase
        .from('polls')
        .select('*')
        .eq('is_on_chain', true) // Only blockchain polls
        .eq('settled', false)    // Not yet settled
        .lt('end_time', new Date().toISOString()); // Has ended

      if (error) {
        console.error('❌ Error fetching polls to settle:', error);
        return;
      }

      if (!pollsToSettle || pollsToSettle.length === 0) {
        console.log('✅ No polls need settlement at this time');
        return;
      }

      console.log(`📊 Found ${pollsToSettle.length} polls that need settlement`);

      // Process each poll
      for (const poll of pollsToSettle) {
        await this.settlePoll(poll);
      }

    } catch (error) {
      console.error('❌ Error in auto-settlement check:', error);
    }
  }

  // Settle a single poll automatically
  async settlePoll(poll) {
    try {
      console.log(`🎯 Settling poll: ${poll.title} (ID: ${poll.id})`);

      // Get all votes for this poll
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('option_index, voter_address')
        .eq('poll_id', poll.id);

      if (votesError) {
        console.error(`❌ Error fetching votes for poll ${poll.id}:`, votesError);
        return;
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

      console.log(`🏆 Poll ${poll.id} - Winning option: ${winningOption} with ${maxVotes} votes`);

      // Update poll as settled
      const { error: updateError } = await supabase
        .from('polls')
        .update({
          settled: true,
          winning_option: winningOption,
          updated_at: new Date().toISOString()
        })
        .eq('id', poll.id);

      if (updateError) {
        console.error(`❌ Error updating poll ${poll.id} as settled:`, updateError);
        return;
      }

      console.log(`✅ Poll ${poll.id} automatically settled successfully!`);
      console.log(`   - Winning option: ${winningOption}`);
      console.log(`   - Total votes: ${votes.length}`);
      console.log(`   - Vote distribution:`, voteCounts);

      // TODO: Here you could also trigger the smart contract settlement
      // await this.triggerSmartContractSettlement(poll.id, winningOption);

    } catch (error) {
      console.error(`❌ Error settling poll ${poll.id}:`, error);
    }
  }

  // Trigger smart contract settlement (for future implementation)
  async triggerSmartContractSettlement(pollId, winningOption) {
    try {
      console.log(`🔗 Triggering smart contract settlement for poll ${pollId}`);
      
      // This would call the autoSettlePoll function on the smart contract
      // Implementation depends on your blockchain setup
      
      console.log(`✅ Smart contract settlement triggered for poll ${pollId}`);
    } catch (error) {
      console.error(`❌ Error triggering smart contract settlement for poll ${pollId}:`, error);
    }
  }

  // Manual settlement trigger (for testing or admin use)
  async manuallySettlePoll(pollId) {
    try {
      const { data: poll, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (error || !poll) {
        throw new Error('Poll not found');
      }

      await this.settlePoll(poll);
      return { success: true, message: 'Poll settled manually' };
    } catch (error) {
      console.error('❌ Manual settlement error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const autoSettlementService = new AutoSettlementService();

module.exports = autoSettlementService;
