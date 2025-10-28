#!/usr/bin/env node
/**
 * Simple MCP Server Test Script
 * Tests the MCP server without requiring Slack connection
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Starting MCP Server Tests...\n');

// Test 1: Environment Check
console.log('1️⃣ Testing Environment Variables...');
const requiredEnvVars = ['NANGO_SECRET_KEY'];
let envPass = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: Set (${value.substring(0, 8)}...)`);
  } else {
    console.log(`   ❌ ${envVar}: Missing`);
    envPass = false;
  }
});

const optionalEnvVars = ['SLACK_DEFAULT_CONNECTION_ID', 'MCP_CONFIG_PATH'];
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`   📋 ${envVar}: ${value || 'Not set (optional)'}`);
});

console.log(`   Environment Check: ${envPass ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: File Structure Check
console.log('2️⃣ Testing File Structure...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'mcp/base.ts',
  'mcp/registry.ts', 
  'mcp/config.ts',
  'mcp/index.ts',
  'mcp/config.json',
  'mcp/slack/server.ts',
  'mcp/slack/index.ts'
];

let filesPass = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) filesPass = false;
});

console.log(`   File Structure Check: ${filesPass ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: TypeScript Build Check
console.log('3️⃣ Testing TypeScript Build...');
const { execSync } = require('child_process');

try {
  console.log('   Building TypeScript files...');
  execSync('npm run mcp:build', { 
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('   ✅ TypeScript build successful');
  
  // Check if dist files were created
  const distExists = fs.existsSync(path.join(process.cwd(), 'dist', 'mcp'));
  console.log(`   ${distExists ? '✅' : '❌'} Distribution files created`);
  console.log('   Build Check: ✅ PASS\n');
} catch (error) {
  console.log('   ❌ TypeScript build failed');
  console.log(`   Error: ${error.message.split('\n')[0]}`);
  console.log('   Build Check: ❌ FAIL\n');
}

// Test 4: MCP Configuration Test
console.log('4️⃣ Testing MCP Configuration...');
try {
  const configPath = path.join(process.cwd(), 'mcp', 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`   ✅ Config file loaded`);
    console.log(`   ✅ Version: ${config.version}`);
    console.log(`   ✅ Servers configured: ${Object.keys(config.servers).length}`);
    
    if (config.servers.slack) {
      console.log(`   ✅ Slack server enabled: ${config.servers.slack.enabled}`);
      console.log(`   ✅ Slack tools count: ${config.servers.slack.tools.length}`);
    }
    console.log('   Configuration Check: ✅ PASS\n');
  } else {
    console.log('   ❌ Config file not found');
    console.log('   Configuration Check: ❌ FAIL\n');
  }
} catch (error) {
  console.log(`   ❌ Config parsing failed: ${error.message}`);
  console.log('   Configuration Check: ❌ FAIL\n');
}

// Test 5: Server Import Test
console.log('5️⃣ Testing Server Import...');
try {
  // Try to import the built server
  const distPath = path.join(process.cwd(), 'dist', 'mcp', 'slack', 'server.js');
  if (fs.existsSync(distPath)) {
    const { createSlackMCPServer } = require(distPath);
    console.log('   ✅ Server module imported successfully');
    
    // Try to create server instance
    const server = createSlackMCPServer();
    console.log('   ✅ Server instance created');
    
    // Get server info
    const info = server.getServerInfo();
    console.log(`   ✅ Server info: ${info.name} v${info.version}`);
    console.log(`   ✅ Available tools: ${info.tools.length}`);
    
    console.log('   Server Import Check: ✅ PASS\n');
  } else {
    console.log('   ❌ Built server file not found. Run npm run mcp:build first.');
    console.log('   Server Import Check: ❌ FAIL\n');
  }
} catch (error) {
  console.log(`   ❌ Server import failed: ${error.message}`);
  console.log('   Server Import Check: ❌ FAIL\n');
}

// Test 6: AI Brain Interface Test
console.log('6️⃣ Testing AI Brain Interface...');
try {
  const interfacePath = path.join(process.cwd(), 'dist', 'mcp', 'index.js');
  if (fs.existsSync(interfacePath)) {
    const { AIBrainMCPInterface } = require(interfacePath);
    console.log('   ✅ AI Brain interface imported');
    
    const aiInterface = new AIBrainMCPInterface();
    console.log('   ✅ AI Brain interface instance created');
    console.log('   AI Brain Interface Check: ✅ PASS\n');
  } else {
    console.log('   ❌ AI Brain interface file not found');
    console.log('   AI Brain Interface Check: ❌ FAIL\n');
  }
} catch (error) {
  console.log(`   ❌ AI Brain interface test failed: ${error.message}`);
  console.log('   AI Brain Interface Check: ❌ FAIL\n');
}

// Summary
console.log('🎯 Test Summary');
console.log('================');
console.log('✅ = Working correctly');
console.log('❌ = Needs attention');
console.log('📋 = Optional/Info only\n');

console.log('📊 Quick Status Check:');
console.log(`Environment: ${envPass ? '✅' : '❌'}`);
console.log(`Files: ${filesPass ? '✅' : '❌'}`);
console.log(`Build: ${fs.existsSync('dist/mcp') ? '✅' : '❌'}`);
console.log(`Config: ${fs.existsSync('mcp/config.json') ? '✅' : '❌'}`);

console.log('\n🚀 Next Steps:');
console.log('1. If all tests pass: npm run mcp:slack (to start server)');
console.log('2. If build failed: Check TypeScript errors and dependencies');
console.log('3. If env failed: Check .env.local has NANGO_SECRET_KEY');
console.log('4. For real testing: Connect Slack workspace and set SLACK_DEFAULT_CONNECTION_ID');

console.log('\n✨ MCP Server Testing Complete!');