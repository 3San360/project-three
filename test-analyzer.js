#!/usr/bin/env node

const { analyzeFile } = require('./scripts/best-practices-analyzer');

async function testAnalyzer() {
  console.log('Testing Enhanced Best Practices Analyzer...\n');
  
  const testFiles = [
    'examples/bad-example.js',
    'examples/bad-example.py'
  ];
  
  for (const filePath of testFiles) {
    console.log(`\n=== Analyzing ${filePath} ===`);
    
    try {
      const result = await analyzeFile(filePath);
      
      if (result.success) {
        console.log(`✅ Analysis successful`);
        console.log(`Language: ${result.language}`);
        console.log(`Issues found: ${result.issues.length}`);
        console.log(`File size: ${result.stats.size} bytes`);
        console.log(`Lines: ${result.stats.lines}`);
        console.log(`Analysis metrics: ${JSON.stringify(result.analysisMetrics, null, 2)}`);
        
        if (result.issues.length > 0) {
          console.log('\nIssues detected:');
          result.issues.forEach((issue, index) => {
            console.log(`${index + 1}. Line ${issue.line}: ${issue.message} (${issue.type})`);
          });
        }
      } else {
        console.log(`❌ Analysis failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
  }
}

if (require.main === module) {
  testAnalyzer().catch(console.error);
}
