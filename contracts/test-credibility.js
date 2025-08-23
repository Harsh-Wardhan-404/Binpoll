// Test script for credibility requirement
const { ethers } = require("hardhat");

async function testCredibilityRequirement() {
  console.log("🧪 Testing Credibility Requirement...\n");

  // Get the contract factory
  const SimplePoll = await ethers.getContractFactory("SimplePoll");
  const simplePoll = await SimplePoll.deploy();
  await simplePoll.deployed();

  console.log("📋 Contract deployed at:", simplePoll.address);

  // Test parameters
  const title = "Test Poll";
  const description = "Test Description";
  const options = ["Option 1", "Option 2"];
  const durationInSeconds = 3600; // 1 hour
  const requiredCredibility = 15; // This will be returned in the error
  const pollPrice = ethers.utils.parseEther("0.01");
  const maxVotes = 100;
  const creatorDeposit = ethers.utils.parseEther("0.002");

  console.log("💰 Required credibility:", requiredCredibility);
  console.log("🎯 Creator deposit:", ethers.utils.formatEther(creatorDeposit), "BNB\n");

  try {
    console.log("🚀 Attempting to create poll...");
    const tx = await simplePoll.createPoll(
      title,
      description,
      options,
      durationInSeconds,
      requiredCredibility,
      pollPrice,
      maxVotes,
      { value: creatorDeposit }
    );
    
    await tx.wait();
    console.log("✅ Poll created successfully (this shouldn't happen)");
  } catch (error) {
    console.log("❌ Expected failure occurred!");
    console.log("📝 Error message:", error.message);
    
    // Extract the required credibility from the error message
    if (error.message.includes("Required credibility:")) {
      const match = error.message.match(/Required credibility: (\d+)/);
      if (match) {
        const returnedCredibility = match[1];
        console.log("🎯 Returned credibility value:", returnedCredibility);
        console.log("✅ Test passed - credibility value was returned in error message");
      }
    }
  }

  console.log("\n✅ Credibility requirement test completed!");
}

// Run the test
testCredibilityRequirement()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
