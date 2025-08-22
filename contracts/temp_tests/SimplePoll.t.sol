// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SimplePoll} from "./SimplePoll.sol";
import {Test} from "forge-std/Test.sol";

contract SimplePollTest is Test {
    SimplePoll poll;
    address platform = address(0x1);
    address creator = address(0x2);
    address voter1 = address(0x3);
    address voter2 = address(0x4);
    
    function setUp() public {
        vm.prank(platform);
        poll = new SimplePoll();
        
        vm.deal(creator, 10 ether);
        vm.deal(voter1, 10 ether);
        vm.deal(voter2, 10 ether);
    }
    
    function test_CreatePoll() public {
        vm.prank(creator);
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";
        
        uint256 pollId = poll.createPoll("Will BNB hit $1000?", "Prediction for BNB price", options, 24);
        
        assertEq(pollId, 1);
        
        (uint256 id, string memory title, , , , , , , ) = poll.getPoll(pollId);
        assertEq(id, 1);
        assertEq(title, "Will BNB hit $1000?");
    }
    
    function test_Vote() public {
        // Create poll
        vm.prank(creator);
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";
        uint256 pollId = poll.createPoll("Test Poll", "Test Description", options, 24);
        
        // Vote
        vm.prank(voter1);
        poll.vote{value: 0.01 ether}(pollId, 0);
        
        assertEq(poll.getVoterCount(pollId, 0), 1);
        assertEq(poll.getTotalVoters(pollId), 1);
        
        (bool voted, uint256 optionId) = poll.getUserVote(pollId, voter1);
        assertTrue(voted);
        assertEq(optionId, 0);
    }
    
    function test_SettlePoll() public {
        // Create poll with 1 hour duration
        vm.prank(creator);
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";
        uint256 pollId = poll.createPoll("Test Poll", "Test Description", options, 1);
        
        // Multiple votes
        vm.prank(voter1);
        poll.vote{value: 0.01 ether}(pollId, 0); // Winner
        
        vm.prank(voter2);
        poll.vote{value: 0.01 ether}(pollId, 1); // Loser
        
        // Fast forward time past poll end
        vm.warp(block.timestamp + 2 hours);
        
        // Check balances before settlement
        uint256 voter1BalanceBefore = voter1.balance;
        uint256 creatorBalanceBefore = creator.balance;
        uint256 platformBalanceBefore = platform.balance;
        
        // Settle poll (option 0 wins)
        vm.prank(creator);
        poll.settlePoll(pollId, 0);
        
        // Verify settlement
        (, , , , , , bool settled, uint256 winningOption, ) = poll.getPoll(pollId);
        assertTrue(settled);
        assertEq(winningOption, 0);
        
        // Check payouts
        // Total pool: 0.02 ether
        // Winner gets: 85% = 0.017 ether
        // Creator gets: 5% = 0.001 ether  
        // Platform gets: 10% = 0.002 ether
        assertEq(voter1.balance, voter1BalanceBefore + 0.017 ether);
        assertEq(creator.balance, creatorBalanceBefore + 0.001 ether);
        assertEq(platform.balance, platformBalanceBefore + 0.002 ether);
    }
    
    function test_CannotVoteTwice() public {
        vm.prank(creator);
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";
        uint256 pollId = poll.createPoll("Test Poll", "Test Description", options, 24);
        
        vm.prank(voter1);
        poll.vote{value: 0.01 ether}(pollId, 0);
        
        vm.prank(voter1);
        vm.expectRevert("Already voted");
        poll.vote{value: 0.01 ether}(pollId, 1);
    }
    
    function test_CannotVoteAfterEnd() public {
        vm.prank(creator);
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";
        uint256 pollId = poll.createPoll("Test Poll", "Test Description", options, 1);
        
        vm.warp(block.timestamp + 2 hours);
        
        vm.prank(voter1);
        vm.expectRevert("Poll has ended");
        poll.vote{value: 0.01 ether}(pollId, 0);
    }
}
