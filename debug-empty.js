// Simple test to debug empty file handling
const { analyzeFile } = require('./scripts/best-practices-analyzer');
const fs = require('fs').promises;
const path = require('path');

async function testEmptyFile() {
  const emptyFile = path.join(__dirname, 'test-empty.js');
  
  try {
    // Create empty file
    await fs.writeFile(emptyFile, '', 'utf8');
    
    // Test analysis
    const relativePath = path.relative(process.cwd(), emptyFile);
    console.log('Testing file:', relativePath);
    
    const result = await analyzeFile(relativePath);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Clean up
    await fs.unlink(emptyFile);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmptyFile();
