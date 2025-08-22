// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimplePoll {
    uint256 public constant ENTRY_FEE = 0.001 ether;
    uint256 public constant PLATFORM_FEE_PCT = 10; // 10%
    uint256 public constant CREATOR_FEE_PCT = 5;   // 5%
    uint256 public constant WINNER_POOL_PCT = 85;  // 85% to winners
    uint256 public constant MIN_CREATOR_DEPOSIT = 0.002 ether; // Minimum creator deposit
    
    address public immutable platform;
    
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
        uint256 _durationInSeconds
    ) external payable returns (uint256) {
        require(_options.length >= 2 && _options.length <= 5, "2-5 options required");
        require(_durationInSeconds >= 30 && _durationInSeconds <= 2592000, "Duration must be 30 seconds to 30 days (2592000 seconds)");
        require(msg.value >= MIN_CREATOR_DEPOSIT, "Creator deposit too low");
        
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
            exists: true
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
        require(msg.value == ENTRY_FEE, "Must send exactly 0.001 BNB");
        require(polls[_pollId].exists, "Poll does not exist");
        require(block.timestamp < polls[_pollId].endTime, "Poll has ended");
        require(!hasVoted[_pollId][msg.sender], "Already voted");
        require(_optionId < polls[_pollId].options.length, "Invalid option");
        
        hasVoted[_pollId][msg.sender] = true;
        userVotes[_pollId][msg.sender] = _optionId;
        pollVoters[_pollId][_optionId].push(msg.sender);
        polls[_pollId].totalPool += msg.value;
        polls[_pollId].voterPool += msg.value;
        
        emit VoteCast(_pollId, msg.sender, _optionId, msg.value);
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
            // 85% of total pool goes to winners
            // 10% platform fee
            // 5% creator fee
            uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
            uint256 creatorFee = (poll.totalPool * CREATOR_FEE_PCT) / 100;
            uint256 winnerPool = (poll.totalPool * WINNER_POOL_PCT) / 100;
            uint256 rewardPerWinner = winnerPool / totalWinners;
            
            // Transfer fees
            if (platformFee > 0) {
                (bool success,) = payable(platform).call{value: platformFee}("");
                require(success, "Platform fee transfer failed");
            }
            if (creatorFee > 0) {
                (bool success,) = payable(poll.creator).call{value: creatorFee}("");
                require(success, "Creator fee transfer failed");
            }
            
            // Transfer rewards to winners
            for (uint256 i = 0; i < totalWinners; i++) {
                (bool success,) = payable(winners[i]).call{value: rewardPerWinner}("");
                require(success, "Winner reward transfer failed");
            }
            
            emit PollSettled(_pollId, _winningOption, totalWinners, rewardPerWinner, winnerPool);
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
            uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
            uint256 creatorFee = (poll.totalPool * CREATOR_FEE_PCT) / 100;
            uint256 winnerPool = (poll.totalPool * WINNER_POOL_PCT) / 100;
            uint256 rewardPerWinner = winnerPool / totalWinners;
            
            if (platformFee > 0) {
                (bool success,) = payable(platform).call{value: platformFee}("");
                require(success, "Platform fee transfer failed");
            }
            if (creatorFee > 0) {
                (bool success,) = payable(poll.creator).call{value: creatorFee}("");
                require(success, "Creator fee transfer failed");
            }
            
            for (uint256 i = 0; i < totalWinners; i++) {
                (bool success,) = payable(winners[i]).call{value: rewardPerWinner}("");
                require(success, "Winner reward transfer failed");
            }
            
            emit PollSettled(_pollId, _winningOption, totalWinners, rewardPerWinner, winnerPool);
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
            uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
            uint256 creatorFee = (poll.totalPool * CREATOR_FEE_PCT) / 100;
            uint256 winnerPool = (poll.totalPool * WINNER_POOL_PCT) / 100;
            uint256 rewardPerWinner = winnerPool / totalWinners;
            
            // Transfer fees
            if (platformFee > 0) {
                (bool success,) = payable(platform).call{value: platformFee}("");
                require(success, "Platform fee transfer failed");
            }
            if (creatorFee > 0) {
                (bool success,) = payable(poll.creator).call{value: creatorFee}("");
                require(success, "Creator fee transfer failed");
            }
            
            // Transfer rewards to winners
            for (uint256 i = 0; i < totalWinners; i++) {
                (bool success,) = payable(winners[i]).call{value: rewardPerWinner}("");
                require(success, "Winner reward transfer failed");
            }
            
            emit PollSettled(_pollId, winningOption, totalWinners, rewardPerWinner, winnerPool);
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
    function getPoll(uint256 _pollId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        address creator,
        string[] memory options,
        uint256 endTime,
        bool settled,
        uint256 winningOption,
        uint256 totalPool,
        uint256 creatorDeposit,
        uint256 voterPool
    ) {
        Poll memory poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        
        return (
            poll.id,
            poll.title,
            poll.description,
            poll.creator,
            poll.options,
            poll.endTime,
            poll.settled,
            poll.winningOption,
            poll.totalPool,
            poll.creatorDeposit,
            poll.voterPool
        );
    }
    
    function getPollRewardBreakdown(uint256 _pollId) external view returns (
        uint256 totalPool,
        uint256 creatorDeposit,
        uint256 voterPool,
        uint256 projectedWinnerPool,
        uint256 projectedPlatformFee,
        uint256 projectedCreatorFee
    ) {
        Poll memory poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        
        uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
        uint256 creatorFee = (poll.totalPool * CREATOR_FEE_PCT) / 100;
        uint256 winnerPool = (poll.totalPool * WINNER_POOL_PCT) / 100;
        
        return (
            poll.totalPool,
            poll.creatorDeposit,
            poll.voterPool,
            winnerPool,
            platformFee,
            creatorFee
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
}