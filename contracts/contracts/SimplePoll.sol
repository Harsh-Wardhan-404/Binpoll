// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimplePoll {
    // New reward system constants
    uint256 public constant PLATFORM_FEE_PCT = 25; // 25% platform fee
    uint256 public constant CREATOR_REFILL_PCT = 10; // 10% creator refill
    uint256 public constant RANDOM_WINNERS_PCT = 50; // 50% random winners
    uint256 public constant DONATION_PCT = 15; // 15% donation (remaining)
    uint256 public constant VOTER_BET_MARKUP = 110; // 110% (10% markup)
    uint256 public constant MIN_CREATOR_DEPOSIT = 0.002 ether;
    uint256 public constant MIN_CREDIBILITY = 10; // Minimum credibility required
    
    address public immutable platform;
    
    // User credibility system
    mapping(address => uint256) public userCredibility;
    
    struct Poll {
        uint256 id;
        string title;
        string description;
        address creator;
        string[] options;
        uint256 endTime;
        bool settled;
        uint256 winningOption;
        uint256 totalPool;
        uint256 creatorDeposit;
        uint256 voterPool;
        bool exists;
        
        // New fields for reward system
        uint256 requiredCredibility; // Credibility needed to vote
        uint256 pollPrice; // Total bet amount for this poll
        uint256 maxVotes; // Maximum votes allowed for this poll
        uint256 currentVotes; // Current number of votes
        uint256 voterBetAmount; // Bet amount per voter
        bool creatorRefillClaimed; // Whether creator claimed refill
    }
    
    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(uint256 => address[])) public pollVoters; // pollId => optionId => voters
    mapping(uint256 => mapping(address => bool)) public hasVoted; // pollId => voter => hasVoted
    mapping(uint256 => mapping(address => uint256)) public userVotes; // pollId => voter => optionId
    
    uint256 public nextPollId = 1;
    
    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        string title,
        string[] options,
        uint256 endTime,
        uint256 creatorDeposit
    );
    
    event VoteCast(
        uint256 indexed pollId,
        address indexed voter,
        uint256 optionId,
        uint256 amount
    );
    
    event PollSettled(
        uint256 indexed pollId,
        uint256 winningOption,
        uint256 totalWinners,
        uint256 rewardPerWinner,
        uint256 totalRewardPool
    );
    
    event CreatorDepositAdded(
        uint256 indexed pollId,
        address indexed creator,
        uint256 amount,
        uint256 newTotal
    );
    
    constructor() {
        platform = msg.sender;
    }
    
    function createPoll(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _durationInSeconds,
        uint256 _requiredCredibility,
        uint256 _pollPrice,
        uint256 _maxVotes
    ) external payable returns (uint256) {
        require(_options.length >= 2 && _options.length <= 5, "2-5 options required");
        require(_durationInSeconds >= 30 && _durationInSeconds <= 2592000, "Duration must be 30 seconds to 30 days (2592000 seconds)");
        require(msg.value >= MIN_CREATOR_DEPOSIT, "Creator deposit too low");
        require(_requiredCredibility >= MIN_CREDIBILITY, "Required credibility too low");
        require(_pollPrice > 0, "Poll price must be greater than 0");
        require(_maxVotes > 0, "Max votes must be greater than 0");
        
        uint256 pollId = nextPollId++;
        uint256 endTime = block.timestamp + _durationInSeconds;
        
        polls[pollId] = Poll({
            id: pollId,
            title: _title,
            description: _description,
            creator: msg.sender,
            options: _options,
            endTime: endTime,
            settled: false,
            winningOption: 0,
            totalPool: msg.value,
            creatorDeposit: msg.value,
            voterPool: 0,
            exists: true,
            requiredCredibility: _requiredCredibility,
            pollPrice: _pollPrice,
            maxVotes: _maxVotes,
            currentVotes: 0,
            voterBetAmount: 0, // Not used with dynamic pricing
            creatorRefillClaimed: false
        });
        
        emit PollCreated(pollId, msg.sender, _title, _options, endTime, msg.value);
        return pollId;
    }
    
    function addCreatorDeposit(uint256 _pollId) external payable {
        require(polls[_pollId].exists, "Poll does not exist");
        require(msg.sender == polls[_pollId].creator, "Only creator can add deposit");
        require(!polls[_pollId].settled, "Poll already settled");
        require(msg.value > 0, "Must send BNB");
        
        polls[_pollId].creatorDeposit += msg.value;
        polls[_pollId].totalPool += msg.value;
        
        emit CreatorDepositAdded(_pollId, msg.sender, msg.value, polls[_pollId].creatorDeposit);
    }
    
    function vote(uint256 _pollId, uint256 _optionId) external payable {
        Poll storage poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        require(block.timestamp < poll.endTime, "Poll has ended");
        require(!hasVoted[_pollId][msg.sender], "Already voted");
        require(_optionId < poll.options.length, "Invalid option");
        require(poll.currentVotes < poll.maxVotes, "Poll vote limit reached");
        require(userCredibility[msg.sender] >= poll.requiredCredibility, "Insufficient credibility");
        
        // Calculate dynamic vote price based on current position
        uint256 requiredAmount = calculateVotePrice(poll.pollPrice, poll.currentVotes, poll.maxVotes);
        require(msg.value == requiredAmount, "Must send exact dynamic vote amount");
        
        // Update poll state
        hasVoted[_pollId][msg.sender] = true;
        userVotes[_pollId][msg.sender] = _optionId;
        pollVoters[_pollId][_optionId].push(msg.sender);
        poll.currentVotes++;
        poll.totalPool += msg.value;
        poll.voterPool += msg.value;
        
        emit VoteCast(_pollId, msg.sender, _optionId, msg.value);
    }
    
    // Calculate dynamic vote price based on current vote position
    function calculateVotePrice(uint256 _basePrice, uint256 _currentVotes, uint256 _maxVotes) public pure returns (uint256) {
        // Dynamic pricing: price increases as more people vote
        // Formula: basePrice * (1 + (currentVotes / maxVotes) * 4)
        // This means: first vote = basePrice, last vote = 5x basePrice
        uint256 multiplier = 1 + (_currentVotes * 4) / _maxVotes;
        return _basePrice * multiplier;
    }
    
    function settlePoll(uint256 _pollId, uint256 _winningOption) external {
        Poll storage poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        require(msg.sender == poll.creator, "Only creator can settle");
        require(block.timestamp >= poll.endTime, "Poll not yet ended");
        require(!poll.settled, "Poll already settled");
        require(_winningOption < poll.options.length, "Invalid winning option");
        
        poll.settled = true;
        poll.winningOption = _winningOption;
        
        address[] memory winners = pollVoters[_pollId][_winningOption];
        uint256 totalWinners = winners.length;
        
        if (totalWinners > 0) {
            // New Reward Logic:
            // 25% platform fee
            // 10% creator refill (if eligible)
            // 50% random winners
            uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
            uint256 creatorRefill = (poll.totalPool * CREATOR_REFILL_PCT) / 100;
            uint256 randomWinnersPool = (poll.totalPool * RANDOM_WINNERS_PCT) / 100;
            uint256 rewardPerWinner = randomWinnersPool / totalWinners;
            
            // Transfer fees
            if (platformFee > 0) {
                (bool success,) = payable(platform).call{value: platformFee}("");
                require(success, "Platform fee transfer failed");
            }
            if (creatorRefill > 0) {
                (bool success,) = payable(poll.creator).call{value: creatorRefill}("");
                require(success, "Creator refill transfer failed");
            }
            
            // Transfer rewards to winners
            for (uint256 i = 0; i < totalWinners; i++) {
                (bool success,) = payable(winners[i]).call{value: rewardPerWinner}("");
                require(success, "Winner reward transfer failed");
            }
            
            emit PollSettled(_pollId, _winningOption, totalWinners, rewardPerWinner, randomWinnersPool);
        } else {
            // No winners - return most to creator, small fee to platform
            uint256 platformFee = (poll.totalPool * 20) / 100; // 20% to platform
            uint256 creatorRefund = poll.totalPool - platformFee;
            
            (bool success1,) = payable(platform).call{value: platformFee}("");
            require(success1, "Platform fee transfer failed");
            
            (bool success2,) = payable(poll.creator).call{value: creatorRefund}("");
            require(success2, "Creator refund transfer failed");
            
            emit PollSettled(_pollId, _winningOption, 0, 0, 0);
        }
    }
    
    // Emergency settlement by platform (if creator doesn't settle)
    function emergencySettle(uint256 _pollId, uint256 _winningOption) external {
        require(msg.sender == platform, "Only platform can emergency settle");
        Poll storage poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        require(block.timestamp >= poll.endTime + 24 hours, "Must wait 24h after poll end");
        require(!poll.settled, "Poll already settled");
        require(_winningOption < poll.options.length, "Invalid winning option");
        
        // Use same logic as regular settlement
        poll.settled = true;
        poll.winningOption = _winningOption;
        
        address[] memory winners = pollVoters[_pollId][_winningOption];
        uint256 totalWinners = winners.length;
        
        if (totalWinners > 0) {
            // Emergency settlement reward logic
            uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
            uint256 creatorRefill = (poll.totalPool * CREATOR_REFILL_PCT) / 100;
            uint256 randomWinnersPool = (poll.totalPool * RANDOM_WINNERS_PCT) / 100;
            uint256 rewardPerWinner = randomWinnersPool / totalWinners;
            
            if (platformFee > 0) {
                (bool success,) = payable(platform).call{value: platformFee}("");
                require(success, "Platform fee transfer failed");
            }
            if (creatorRefill > 0) {
                (bool success,) = payable(poll.creator).call{value: creatorRefill}("");
                require(success, "Creator refill transfer failed");
            }
            
            for (uint256 i = 0; i < totalWinners; i++) {
                (bool success,) = payable(winners[i]).call{value: rewardPerWinner}("");
                require(success, "Winner reward transfer failed");
            }
            
            emit PollSettled(_pollId, _winningOption, totalWinners, rewardPerWinner, randomWinnersPool);
        } else {
            uint256 platformFee = (poll.totalPool * 20) / 100;
            uint256 creatorRefund = poll.totalPool - platformFee;
            
            (bool success1,) = payable(platform).call{value: platformFee}("");
            require(success1, "Platform fee transfer failed");
            
            (bool success2,) = payable(platform).call{value: creatorRefund}("");
            require(success2, "Creator refund transfer failed");
            
            emit PollSettled(_pollId, _winningOption, 0, 0, 0);
        }
        }
    
    // Credibility management functions
    function setUserCredibility(address _user, uint256 _credibility) external {
        require(msg.sender == platform, "Only platform can set credibility");
        userCredibility[_user] = _credibility;
    }
    
    function increaseCredibility(address _user, uint256 _amount) external {
        require(msg.sender == platform, "Only platform can increase credibility");
        userCredibility[_user] += _amount;
    }
    
    function decreaseCredibility(address _user, uint256 _amount) external {
        require(msg.sender == platform, "Only platform can decrease credibility");
        if (userCredibility[_user] > _amount) {
            userCredibility[_user] -= _amount;
        } else {
            userCredibility[_user] = 0;
        }
    }
    
    // New reward calculation function
    function calculateRewards(uint256 _pollId) public view returns (
        uint256 platformFee,
        uint256 creatorRefill,
        uint256 randomWinnersPool,
        uint256 donationAmount,
        bool isEligibleForRefill
    ) {
        Poll memory poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        
        // Calculate left balance based on the formula
        uint256 totalPolls = nextPollId - 1;
        uint256 lostVoters = poll.maxVotes - poll.currentVotes;
        
        // left_balance = ((1.10 * lost_voters) / (voter_limit * number_of_polls)) * creator_fee
        uint256 leftBalance = 0;
        if (totalPolls > 0 && poll.maxVotes > 0) {
            leftBalance = ((VOTER_BET_MARKUP * lostVoters) / (poll.maxVotes * totalPolls)) * poll.creatorDeposit;
        }
        
        // Check if creator is eligible for refill (90% engagement on 75% of polls)
        if (poll.currentVotes >= (poll.maxVotes * 90) / 100) {
            isEligibleForRefill = true;
        }
        
        // Calculate reward distribution
        platformFee = (leftBalance * PLATFORM_FEE_PCT) / 100;
        creatorRefill = isEligibleForRefill ? (leftBalance * CREATOR_REFILL_PCT) / 100 : 0;
        randomWinnersPool = (leftBalance * RANDOM_WINNERS_PCT) / 100;
        donationAmount = leftBalance - platformFee - creatorRefill - randomWinnersPool;
        
        return (platformFee, creatorRefill, randomWinnersPool, donationAmount, isEligibleForRefill);
    }
    
    // Automatic settlement based on most voted option
    function autoSettlePoll(uint256 _pollId) external {
        Poll storage poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        require(block.timestamp >= poll.endTime, "Poll not yet ended");
        require(!poll.settled, "Poll already settled");
        
        // Find the option with the most votes
        uint256 winningOption = 0;
        uint256 maxVotes = 0;
        
        for (uint256 i = 0; i < poll.options.length; i++) {
            uint256 optionVotes = pollVoters[_pollId][i].length;
            if (optionVotes > maxVotes) {
                maxVotes = optionVotes;
                winningOption = i;
            }
        }
        
        // Mark poll as settled
        poll.settled = true;
        poll.winningOption = winningOption;
        
        // Distribute rewards
        address[] memory winners = pollVoters[_pollId][winningOption];
        uint256 totalWinners = winners.length;
        
        if (totalWinners > 0) {
            // Auto settlement reward logic
            uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
            uint256 creatorRefill = (poll.totalPool * CREATOR_REFILL_PCT) / 100;
            uint256 randomWinnersPool = (poll.totalPool * RANDOM_WINNERS_PCT) / 100;
            uint256 rewardPerWinner = randomWinnersPool / totalWinners;
            
            // Transfer fees
            if (platformFee > 0) {
                (bool success,) = payable(platform).call{value: platformFee}("");
                require(success, "Platform fee transfer failed");
            }
            if (creatorRefill > 0) {
                (bool success,) = payable(poll.creator).call{value: creatorRefill}("");
                require(success, "Creator refill transfer failed");
            }
            
            // Transfer rewards to winners
            for (uint256 i = 0; i < totalWinners; i++) {
                (bool success,) = payable(winners[i]).call{value: rewardPerWinner}("");
                require(success, "Winner reward transfer failed");
            }
            
            emit PollSettled(_pollId, winningOption, totalWinners, rewardPerWinner, randomWinnersPool);
        } else {
            // No winners - return most to creator, small fee to platform
            uint256 platformFee = (poll.totalPool * 20) / 100;
            uint256 creatorRefund = poll.totalPool - platformFee;
            
            (bool success1,) = payable(platform).call{value: platformFee}("");
            require(success1, "Platform fee transfer failed");
            
            (bool success2,) = payable(poll.creator).call{value: creatorRefund}("");
            require(success2, "Creator refund transfer failed");
            
            emit PollSettled(_pollId, winningOption, 0, 0, 0);
        }
    }

    // View functions
    function getPoll(uint256 _pollId) external view returns (Poll memory) {
        Poll memory poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        return poll;
    }
    
    function getPollRewardBreakdown(uint256 _pollId) external view returns (
        uint256 totalPool,
        uint256 creatorDeposit,
        uint256 voterPool,
        uint256 projectedRandomWinnersPool,
        uint256 projectedPlatformFee,
        uint256 projectedCreatorRefill
    ) {
        Poll memory poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        
        uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
        uint256 creatorRefill = (poll.totalPool * CREATOR_REFILL_PCT) / 100;
        uint256 randomWinnersPool = (poll.totalPool * RANDOM_WINNERS_PCT) / 100;
        
        return (
            poll.totalPool,
            poll.creatorDeposit,
            poll.voterPool,
            randomWinnersPool,
            platformFee,
            creatorRefill
        );
    }
    
    function getVotersForOption(uint256 _pollId, uint256 _optionId) external view returns (address[] memory) {
        return pollVoters[_pollId][_optionId];
    }
    
    function getVoterCount(uint256 _pollId, uint256 _optionId) external view returns (uint256) {
        return pollVoters[_pollId][_optionId].length;
    }
    
    function getTotalVoters(uint256 _pollId) external view returns (uint256) {
        require(polls[_pollId].exists, "Poll does not exist");
        
        uint256 total = 0;
        for (uint256 i = 0; i < polls[_pollId].options.length; i++) {
            total += pollVoters[_pollId][i].length;
        }
        return total;
    }
    
    // Get user credibility
    function getUserCredibility(address _user) external view returns (uint256) {
        return userCredibility[_user];
    }
    
    // Get poll statistics for reward calculation
    function getPollStats(uint256 _pollId) external view returns (
        uint256 currentVotes,
        uint256 maxVotes,
        uint256 voterBetAmount,
        uint256 requiredCredibility,
        bool isEligibleForRefill
    ) {
        Poll memory poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        
        isEligibleForRefill = poll.currentVotes >= (poll.maxVotes * 90) / 100;
        
        return (
            poll.currentVotes,
            poll.maxVotes,
            poll.voterBetAmount,
            poll.requiredCredibility,
            isEligibleForRefill
        );
    }
}