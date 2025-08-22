const baseUrl = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Login with demo customer account
    console.log('1. Testing login with demo customer account...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@demo.com',
        password: 'password'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', {
        user: loginData.user.name,
        role: loginData.user.role,
        email: loginData.user.email
      });

      // Test 2: Verify token works
      console.log('\n2. Testing authenticated request...');
      const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (meResponse.ok) {
        const userData = await meResponse.json();
        console.log('✅ Token verification successful:', {
          user: userData.name,
          role: userData.role
        });
      } else {
        console.log('❌ Token verification failed');
      }

    } else {
      const error = await loginResponse.json();
      console.log('❌ Login failed:', error.message);
    }

    // Test 3: Test registration
    console.log('\n3. Testing registration...');
    const testEmail = `test-${Date.now()}@example.com`;
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'testpassword',
        name: 'Test User',
        role: 'customer',
        phone: '+250781234567'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', {
        user: registerData.user.name,
        email: registerData.user.email,
        role: registerData.user.role
      });
    } else {
      const error = await registerResponse.json();
      console.log('❌ Registration failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAuth();
