import fetch from 'node-fetch';

async function testAPIEndpoints() {
  try {
    console.log('Testing API endpoints...');
    
    // Test GET endpoint
    console.log('\nTesting GET /test...');
    const getResponse = await fetch('http://localhost:5000/test');
    const getData = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', getData);
    
    // Test PUT endpoint
    console.log('\nTesting PUT /test-put...');
    const putResponse = await fetch('http://localhost:5000/test-put', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: 'data',
        timestamp: Date.now()
      })
    });
    const putData = await putResponse.json();
    console.log('Status:', putResponse.status);
    console.log('Response:', putData);
    
    // Test the actual professional profiles endpoint
    console.log('\nTesting PUT /api/professionalprofiles...');
    const profileResponse = await fetch('http://localhost:5000/api/professionalprofiles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your_test_token' // Replace with a valid token if needed
      },
      body: JSON.stringify({
        name: 'Test User',
        title: 'Test Title',
        bio: 'Test Bio',
        expertise: 'Test, Expertise',
        rate: 0,
        industries: [],
        skills: []
      })
    });
    
    console.log('Status:', profileResponse.status);
    
    try {
      const profileData = await profileResponse.json();
      console.log('Response:', profileData);
    } catch (err) {
      console.log('Error parsing response:', err.message);
      console.log('Raw response:', await profileResponse.text());
    }
    
  } catch (error) {
    console.error('Error testing API endpoints:', error);
  }
}

testAPIEndpoints(); 