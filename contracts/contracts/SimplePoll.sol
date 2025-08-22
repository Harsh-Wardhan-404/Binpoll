// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimplePoll {
    uint256 public constant ENTRY_FEE = 0.001 ether;
    uint256 public constant PLATFORM_FEE_PCT = 10; // 10%
    uint256 public constant CREATOR_FEE_PCT = 5;   // 5%
    
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
        uint256 endTime
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
        uint256 rewardPerWinner
    );
    
    constructor() {
        platform = msg.sender;
    }
    
    function createPoll(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _durationInHours
    ) external returns (uint256) {
        require(_options.length >= 2 && _options.length <= 5, "2-5 options required");
        require(_durationInHours > 0 && _durationInHours <= 720, "Duration must be 1 hour to 30 days");
        
        uint256 pollId = nextPollId++;
        uint256 endTime = block.timestamp + (_durationInHours * 1 hours);
        
        polls[pollId] = Poll({
            id: pollId,
            title: _title,
            description: _description,
            creator: msg.sender,
            options: _options,
            endTime: endTime,
            settled: false,
            winningOption: 0,
            totalPool: 0,
            exists: true
        });
        
        emit PollCreated(pollId, msg.sender, _title, _options, endTime);
        return pollId;
    }
    
    function vote(uint256 _pollId, uint256 _optionId) external payable {
        require(msg.value == ENTRY_FEE, "Must send exactly 0.01 BNB");
        require(polls[_pollId].exists, "Poll does not exist");
        require(block.timestamp < polls[_pollId].endTime, "Poll has ended");
        require(!hasVoted[_pollId][msg.sender], "Already voted");
        require(_optionId < polls[_pollId].options.length, "Invalid option");
        
        hasVoted[_pollId][msg.sender] = true;
        userVotes[_pollId][msg.sender] = _optionId;
        pollVoters[_pollId][_optionId].push(msg.sender);
        polls[_pollId].totalPool += msg.value;
        
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
            // Calculate distributions
            uint256 platformFee = (poll.totalPool * PLATFORM_FEE_PCT) / 100;
            uint256 creatorFee = (poll.totalPool * CREATOR_FEE_PCT) / 100;
            uint256 winnerPool = poll.totalPool - platformFee - creatorFee;
            uint256 rewardPerWinner = winnerPool / totalWinners;
            
            // Transfer fees
            if (platformFee > 0) {
                payable(platform).transfer(platformFee);
            }
            if (creatorFee > 0) {
                payable(poll.creator).transfer(creatorFee);
            }
            
            // Transfer rewards to winners
            for (uint256 i = 0; i < totalWinners; i++) {
                payable(winners[i]).transfer(rewardPerWinner);
            }
            
            emit PollSettled(_pollId, _winningOption, totalWinners, rewardPerWinner);
        } else {
            // No winners, return to creator and platform
            uint256 platformFee = (poll.totalPool * 50) / 100; // 50% to platform
            uint256 creatorRefund = poll.totalPool - platformFee;
            
            payable(platform).transfer(platformFee);
            payable(poll.creator).transfer(creatorRefund);
            
            emit PollSettled(_pollId, _winningOption, 0, 0);
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
        uint256 totalPool
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
            poll.totalPool
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