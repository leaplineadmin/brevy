#!/usr/bin/env node

/**
 * Test script to verify prerender-node bot detection
 * This script simulates different bot user agents to test the middleware
 */

const http = require('http');

// Test different bot user agents
const botTests = [
  {
    name: 'Googlebot',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    expectedBehavior: 'Should be pre-rendered'
  },
  {
    name: 'Bingbot',
    userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    expectedBehavior: 'Should be pre-rendered'
  },
  {
    name: 'LinkedInBot',
    userAgent: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com/crawler)',
    expectedBehavior: 'Should be pre-rendered'
  },
  {
    name: 'Facebook Bot',
    userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    expectedBehavior: 'Should be pre-rendered'
  },
  {
    name: 'Twitter Bot',
    userAgent: 'Twitterbot/1.0',
    expectedBehavior: 'Should be pre-rendered'
  },
  {
    name: 'Normal Chrome Browser',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    expectedBehavior: 'Should NOT be pre-rendered (normal SPA)'
  },
  {
    name: 'Normal Firefox Browser',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    expectedBehavior: 'Should NOT be pre-rendered (normal SPA)'
  }
];

console.log('🤖 Testing Bot Detection for Prerender.io Middleware\n');

// Test function to make HTTP request with specific user agent
function testBotDetection(host, port, userAgent, botName) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          botName: botName,
          userAgent: userAgent
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  const host = 'localhost';
  const port = process.env.PORT || 10000;
  
  console.log(`Testing against ${host}:${port}\n`);
  
  for (const test of botTests) {
    try {
      console.log(`Testing ${test.name}...`);
      console.log(`User-Agent: ${test.userAgent}`);
      console.log(`Expected: ${test.expectedBehavior}`);
      
      const result = await testBotDetection(host, port, test.userAgent, test.name);
      
      console.log(`Status: ${result.statusCode}`);
      console.log(`Content-Type: ${result.headers['content-type']}`);
      console.log(`Response length: ${result.body.length} characters`);
      
      // Check if response contains pre-rendered content (look for meta tags, structured data, etc.)
      const isPrerendered = result.body.includes('<meta name="description"') || 
                           result.body.includes('application/ld+json') ||
                           result.body.includes('og:title');
      
      if (test.name.includes('Normal')) {
        // Normal browsers should get the SPA (not pre-rendered)
        console.log(`✅ ${test.name}: ${isPrerendered ? 'Unexpectedly pre-rendered' : 'Correctly served SPA'}`);
      } else {
        // Bots should get pre-rendered content
        console.log(`✅ ${test.name}: ${isPrerendered ? 'Correctly pre-rendered' : 'Not pre-rendered (may be normal if server not running)'}`);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      console.log('---\n');
    }
  }
}

// Check if server is running
console.log('Make sure your server is running with: npm run dev\n');

runTests().catch(console.error);
