// Simple test script to verify API endpoints
// Run with: node test-api.js

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  try {
    // Test 1: Get polls (public endpoint)
    console.log('1. Testing GET /api/polls...');
    const pollsResponse = await fetch(`${API_BASE_URL}/polls`);
    const pollsData = await pollsResponse.json();
    console.log('✅ Polls endpoint:', pollsResponse.status, pollsData.success ? 'Success' : 'Failed');
    console.log(`   Found ${pollsData.data?.length || 0} polls\n`);

    // Test 2: Get single poll (if polls exist)
    if (pollsData.data && pollsData.data.length > 0) {
      const firstPoll = pollsData.data[0];
      console.log('2. Testing GET /api/polls/:id...');
      const singlePollResponse = await fetch(`${API_BASE_URL}/polls/${firstPoll.id}`);
      const singlePollData = await singlePollResponse.json();
      console.log('✅ Single poll endpoint:', singlePollResponse.status, singlePollData.success ? 'Success' : 'Failed');
      console.log(`   Poll title: ${singlePollData.data?.title || 'N/A'}\n`);
    }

    // Test 3: Test authentication endpoint (without proper signature)
    console.log('3. Testing POST /api/auth/wallet (without signature)...');
    const authResponse = await fetch(`${API_BASE_URL}/auth/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        message: 'test',
        signature: 'invalid'
      })
    });
    const authData = await authResponse.json();
    console.log('✅ Auth endpoint:', authResponse.status, authData.success ? 'Success' : 'Failed (expected)');
    console.log(`   Response: ${authData.error || 'Authentication failed as expected'}\n`);

    console.log('🎉 API tests completed!');
    console.log('\n📝 Notes:');
    console.log('- Create poll and vote endpoints require authentication');
    console.log('- To test full functionality, use the frontend with wallet connection');
    console.log('- Make sure the backend server is running on port 3000');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend server is running');
    console.log('2. Check if the API URL is correct');
    console.log('3. Verify CORS settings in the backend');
  }
}

// Run the test
testAPI();
