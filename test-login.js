const fetch = require('node-fetch');

async function testLogin() {
    try {
        const response = await fetch('http://localhost:3002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: 'admin@ehub.ph',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log('Login Response:', data);
        
        if (data.token) {
            console.log('✅ Login successful!');
            console.log('User:', data.user);
            console.log('Token:', data.token.substring(0, 50) + '...');
        } else {
            console.log('❌ Login failed:', data.error);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();
