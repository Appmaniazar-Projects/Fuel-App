/**
 * scripts/generate-keys.js
 * Generate API keys for different applications
 */

const { generateAPIKey, generateAppKeys } = require('../lib/api-keys');

function generateKeysForApp(appName) {
  console.log(`🔑 Generating API keys for: ${appName}\n`);
  
  const keys = generateAppKeys(appName);
  
  console.log('📋 Generated Keys:');
  console.log('─'.repeat(50));
  
  Object.entries(keys).forEach(([env, keyInfo]) => {
    console.log(`\n🌍 ${env.toUpperCase()} Environment:`);
    console.log(`   Key: ${keyInfo.key}`);
    console.log(`   Type: ${keyInfo.type}`);
    console.log(`   Created: ${keyInfo.createdAt}`);
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log('✅ Keys generated successfully!\n');
  
  console.log('📝 Environment Variables for Vercel:');
  console.log(`FILLUP_API_KEYS=${keys.live.key}`);
  console.log(`FILLUP_DEV_MODE=false\n`);
  
  return keys;
}

function generateSingleKey(type = 'live', appName = 'custom') {
  const keyInfo = generateAPIKey(type, appName);
  
  console.log('🔑 Generated Single API Key:');
  console.log('─'.repeat(40));
  console.log(`Key: ${keyInfo.key}`);
  console.log(`Type: ${keyInfo.type}`);
  console.log(`App: ${keyInfo.appName}`);
  console.log(`Created: ${keyInfo.createdAt}`);
  console.log('─'.repeat(40));
  
  return keyInfo;
}

// Command line interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'app':
      const appName = args[1] || 'myapp';
      generateKeysForApp(appName);
      break;
      
    case 'single':
      const type = args[1] || 'live';
      const appName2 = args[2] || 'custom';
      generateSingleKey(type, appName2);
      break;
      
    default:
      console.log('🔑 API Key Generator\n');
      console.log('Usage:');
      console.log('  node scripts/generate-keys.js app <app-name>     # Generate keys for an app');
      console.log('  node scripts/generate-keys.js single <type>     # Generate single key');
          console.log('Examples:');
      console.log('  node scripts/generate-keys.js app base44');
      console.log('  node scripts/generate-keys.js single live myapp');
      }
}

if (require.main === module) {
  main();
}

module.exports = { generateKeysForApp, showPredefinedKeys, generateSingleKey };
