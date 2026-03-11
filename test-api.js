#!/usr/bin/env node

/**
 * SimCo Backend Testing Script
 * Run this to test all API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(method, url, body = null, description = '') {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    console.log(`\n🧪 ${description}`);
    console.log(`${method} ${url}`);

    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${response.status} - Success`);
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`❌ ${response.status} - Error: ${data.error}`);
    }

    return { response, data };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { error };
  }
}

async function runTests() {
  console.log('🚀 SimCo Backend API Tests\n');

  // Test health check
  await testEndpoint('GET', '/api/health', null, 'Health Check');

  // Get channels
  const channelsResult = await testEndpoint('GET', '/api/channels', null, 'Get All Channels');

  if (channelsResult.data?.channels?.length > 0) {
    const firstChannel = channelsResult.data.channels[0];
    const channelId = firstChannel._id;

    // Send a message
    await testEndpoint(
      'POST',
      `/api/channels/${channelId}/messages`,
      { content: 'Hello from test script!' },
      'Send Message'
    );

    // Get messages
    await testEndpoint(
      'GET',
      `/api/channels/${channelId}/messages`,
      null,
      'Get Messages'
    );

    // Trigger agent discussion
    await testEndpoint(
      'POST',
      `/api/channels/${channelId}/trigger-discussion`,
      {
        scenario: {
          title: 'Test Scenario',
          description: 'Testing the agent discussion feature'
        }
      },
      'Trigger Agent Discussion'
    );

    // Vector search
    await testEndpoint(
      'POST',
      `/api/channels/${channelId}/vector-search`,
      { query: 'hello' },
      'Vector Search'
    );
  }

  console.log('\n✨ Testing complete!');
  console.log('\n📖 API Documentation: http://localhost:3001/api-docs');
  console.log('🔧 Mastra Studio: Run "npx mastra studio" in a separate terminal');
}

runTests().catch(console.error);