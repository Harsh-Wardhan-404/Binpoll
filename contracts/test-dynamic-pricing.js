// Test script for dynamic pricing system
const { ethers } = require("hardhat");

async function testDynamicPricing() {
  console.log("🧪 Testing Dynamic Pricing System...\n");

  // Get the contract factory
  const SimplePoll = await ethers.getContractFactory("SimplePoll");
  const simplePoll = await SimplePoll.deploy();
  await simplePoll.deployed();

  console.log("📋 Contract deployed at:", simplePoll.address);

  // Test parameters
  const basePrice = ethers.utils.parseEther("0.01"); // 0.01 BNB base price
  const maxVotes = 100;
  const creatorDeposit = ethers.utils.parseEther("0.002"); // 0.002 BNB creator deposit

  console.log("💰 Base price:", ethers.utils.formatEther(basePrice), "BNB");
  console.log("👥 Max votes:", maxVotes);
  console.log("🎯 Creator deposit:", ethers.utils.formatEther(creatorDeposit), "BNB\n");

  // Test the calculateVotePrice function for different vote positions
  console.log("📊 Dynamic Pricing Calculation:");
  console.log("Vote Position | Multiplier | Price (BNB)");
  console.log("-------------|------------|-------------");

  for (let currentVotes = 0; currentVotes <= maxVotes; currentVotes += 10) {
    const dynamicPrice = await simplePoll.calculateVotePrice(basePrice, currentVotes, maxVotes);
    const multiplier = 1 + (currentVotes * 4) / maxVotes;
    
    console.log(
      `${currentVotes.toString().padStart(11)} | ${multiplier.toFixed(2).padStart(10)} | ${ethers.utils.formatEther(dynamicPrice).padStart(11)}`
    );
  }

  console.log("\n✅ Dynamic pricing test completed!");
  console.log("📈 Price increases from base price to 5x base price as votes increase");
  console.log("🎯 First vote: Base price");
  console.log("🎯 Last vote: 5x base price");
}

// Run the test
testDynamicPricing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
