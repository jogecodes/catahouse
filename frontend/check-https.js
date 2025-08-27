import fetch from 'node-fetch';

const SITE_URL = 'https://catahouse.yourmovietasteprobablysucks.com';

async function checkHTTPS() {
  console.log('🔒 Checking HTTPS enforcement...\n');

  try {
    // Test HTTP to HTTPS redirect
    console.log('1. Testing HTTP to HTTPS redirect...');
    const httpResponse = await fetch(`http://catahouse.yourmovietasteprobablysucks.com`, {
      redirect: 'manual'
    });
    
    if (httpResponse.status === 301 || httpResponse.status === 302) {
      console.log('✅ HTTP redirects to HTTPS correctly');
    } else {
      console.log('❌ HTTP does not redirect to HTTPS');
    }

    // Test HTTPS directly
    console.log('\n2. Testing HTTPS access...');
    const httpsResponse = await fetch(SITE_URL);
    
    if (httpsResponse.ok) {
      console.log('✅ HTTPS access works correctly');
    } else {
      console.log('❌ HTTPS access failed');
    }

    // Check security headers
    console.log('\n3. Checking security headers...');
    const headers = httpsResponse.headers;
    
    const requiredHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    requiredHeaders.forEach(header => {
      if (headers.get(header)) {
        console.log(`✅ ${header} header present`);
      } else {
        console.log(`❌ ${header} header missing`);
      }
    });

    console.log('\n🎉 HTTPS check complete!');

  } catch (error) {
    console.error('❌ Error checking HTTPS:', error.message);
  }
}

checkHTTPS(); 