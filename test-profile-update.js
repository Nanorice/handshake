const axios = require('axios');

// Test profile update API directly
async function testProfileUpdate() {
  try {
    console.log('🧪 Testing Profile Update API...');
    
    // You'll need to replace this with an actual auth token
    const AUTH_TOKEN = 'your_actual_token_here';
    const API_BASE_URL = 'http://localhost:5000/api';
    
    if (AUTH_TOKEN === 'your_actual_token_here') {
      console.log('❌ Please update the AUTH_TOKEN in the script with your actual token');
      console.log('💡 You can find your token in browser developer tools -> Application -> localStorage -> token');
      return;
    }
    
    console.log('📝 Step 1: Getting current user profile...');
    const currentProfile = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    console.log('✅ Current profile data:', {
      name: currentProfile.data.data.name,
      firstName: currentProfile.data.data.firstName,
      lastName: currentProfile.data.data.lastName,
      email: currentProfile.data.data.email
    });
    
    // Test update with new name
    const testName = `Test User ${Date.now()}`;
    console.log(`📝 Step 2: Updating profile with name: "${testName}"`);
    
    const updateResponse = await axios.put(`${API_BASE_URL}/auth/profile`, {
      name: testName,
      firstName: testName.split(' ')[0],
      lastName: testName.split(' ').slice(1).join(' ')
    }, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    console.log('✅ Update response:', updateResponse.data);
    
    // Verify the update
    console.log('📝 Step 3: Fetching updated profile to verify...');
    const updatedProfile = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    console.log('✅ Updated profile data:', {
      name: updatedProfile.data.data.name,
      firstName: updatedProfile.data.data.firstName,
      lastName: updatedProfile.data.data.lastName,
      email: updatedProfile.data.data.email
    });
    
    const wasUpdated = updatedProfile.data.data.name === testName;
    console.log(`${wasUpdated ? '✅' : '❌'} Profile update ${wasUpdated ? 'successful' : 'failed'}!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testProfileUpdate(); 