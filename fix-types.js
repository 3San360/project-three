#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the analyzer file
const analyzerPath = path.join(__dirname, 'scripts', 'best-practices-analyzer.js');
let content = fs.readFileSync(analyzerPath, 'utf8');

// Define the type mappings based on function context
const typeMappings = [
  // Naming convention issues
  { context: 'analyzeNamingConventions', type: 'naming' },
  { context: 'analyzeFunctionLength', type: 'function-length' },
  { context: 'analyzeLineLength', type: 'line-length' },
  { context: 'analyzeCodeDuplication', type: 'duplication' },
  { context: 'analyzeLanguageSpecific', type: 'language-specific' }
];

// Function to add type field to issues.push calls
function addTypeToIssues(content, functionName, issueType) {
  // Find the function
  const functionRegex = new RegExp(`function ${functionName}\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}\\s*(?=\\n|$)`, 'g');
  
  return content.replace(functionRegex, (match) => {
    // Add type field to all issues.push calls within this function
    return match.replace(/issues\.push\(\{([^}]*)\}\);/g, (issueMatch, issueContent) => {
      // Check if type field already exists
      if (issueContent.includes('type:')) {
        return issueMatch;
      }
      
      // Add type field after file field
      const updatedContent = issueContent.replace(
        /(file:\s*[^,]+,)/,
        `$1\n            type: '${issueType}',`
      );
      
      return `issues.push({${updatedContent}});`;
    });
  });
}

// Apply type mappings
typeMappings.forEach(({ context, type }) => {
  content = addTypeToIssues(content, context, type);
});

// Write the updated content back
fs.writeFileSync(analyzerPath, content, 'utf8');

console.log('✅ Added type fields to all issue objects in the analyzer');
console.log('🔍 Updated functions:', typeMappings.map(m => m.context).join(', '));
