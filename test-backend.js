import http from 'http';

function testLogin() {
    const postData = JSON.stringify({
        identifier: 'admin@ehub.ph',
        password: 'admin123'
    });

    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ Backend Login Test:');
                console.log('Status:', res.statusCode);
                console.log('Response:', response);

                if (response.token) {
                    console.log('🎉 SUCCESS: Backend is working perfectly!');
                    console.log('User:', response.user.name, '(' + response.user.role + ')');
                } else {
                    console.log('❌ Login failed:', response.error);
                }
            } catch (error) {
                console.error('Error parsing response:', error.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('Request error:', error.message);
    });

    req.write(postData);
    req.end();
}

testLogin();
