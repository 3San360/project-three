/**
 * Test suite for the custom best practices analyzer
 * 
 * This test suite ensures the analyzer correctly identifies
 * various code quality issues across different languages.
 */

const {
  analyzeFile,
  analyzeNamingConventions,
  analyzeFunctionLength,
  analyzeLineLength,
  analyzeCodeDuplication,
  analyzeLanguageSpecific
} = require('../scripts/best-practices-analyzer');

const fs = require('fs').promises;
const path = require('path');

describe('Best Practices Analyzer', () => {
  
  describe('analyzeNamingConventions', () => {
    test('should detect camelCase violations in JavaScript', () => {
      const content = 'function Bad_Function_Name() {}';
      const issues = analyzeNamingConventions(content, 'javascript', 'test.js');
      
      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('naming-convention-function');
      expect(issues[0].message).toContain('camelCase');
    });
    
    test('should detect snake_case violations in Python', () => {
      const content = 'def BadFunctionName():\n    pass';
      const issues = analyzeNamingConventions(content, 'python', 'test.py');
      
      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('naming-convention-function');
      expect(issues[0].message).toContain('snake_case');
    });
    
    test('should detect non-descriptive variable names', () => {
      const content = 'let x = 1;\nlet y = 2;';
      const issues = analyzeNamingConventions(content, 'javascript', 'test.js');
      
      expect(issues).toHaveLength(2);
      expect(issues[0].rule).toBe('naming-convention-descriptive');
    });
  });
  
  describe('analyzeLineLength', () => {
    test('should detect lines exceeding maximum length', () => {
      const longLine = 'const veryLongVariableName = "this is a very long string that definitely exceeds the 120 character limit for line length";';
      const issues = analyzeLineLength(longLine, 'test.js');
      
      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('line-length');
      expect(issues[0].message).toContain('too long');
    });
  });
  
  describe('analyzeLanguageSpecific', () => {
    test('should detect console statements in JavaScript', () => {
      const content = 'console.log("debug message");';
      const issues = analyzeLanguageSpecific(content, 'javascript', 'test.js');
      
      const consoleIssues = issues.filter(i => i.rule === 'no-console');
      expect(consoleIssues).toHaveLength(1);
    });
    
    test('should detect var usage in JavaScript', () => {
      const content = 'var oldStyle = "should use let or const";';
      const issues = analyzeLanguageSpecific(content, 'javascript', 'test.js');
      
      const varIssues = issues.filter(i => i.rule === 'no-var');
      expect(varIssues).toHaveLength(1);
    });
    
    test('should detect bare except in Python', () => {
      const content = 'try:\n    risky_operation()\nexcept:\n    pass';
      const issues = analyzeLanguageSpecific(content, 'python', 'test.py');
      
      const exceptIssues = issues.filter(i => i.rule === 'no-bare-except');
      expect(exceptIssues).toHaveLength(1);
    });
  });
  
  describe('analyzeCodeDuplication', () => {
    test('should detect duplicate code blocks', () => {
      const content = `
        function processA() {
          const result = getData();
          validateResult(result);
          saveResult(result);
          return result;
        }
        
        function processB() {
          const result = getData();
          validateResult(result);
          saveResult(result);
          return result;
        }
      `;
      
      const issues = analyzeCodeDuplication(content, 'test.js');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].rule).toBe('code-duplication');
    });
  });
  
  describe('analyzeFile integration', () => {
    test('should analyze a real JavaScript file', async () => {
      // Create a temporary test file
      const testContent = `
        var userName = 'test'; // var usage
        console.log(userName); // console statement
        
        function User_Manager() { // naming convention
          let a = 1; // non-descriptive name
          return a;
        }
      `;
      
      const testFile = 'test-temp.js';
      await fs.writeFile(testFile, testContent);
      
      try {
        const issues = await analyzeFile(testFile);
        expect(issues.length).toBeGreaterThan(0);
        
        // Should detect var usage
        expect(issues.some(i => i.rule === 'no-var')).toBe(true);
        
        // Should detect console statement
        expect(issues.some(i => i.rule === 'no-console')).toBe(true);
        
        // Should detect naming convention
        expect(issues.some(i => i.rule === 'naming-convention-function')).toBe(true);
        
      } finally {
        // Clean up
        await fs.unlink(testFile).catch(() => {});
      }
    });
  });
  
  describe('Error handling', () => {
    test('should handle non-existent files gracefully', async () => {
      const issues = await analyzeFile('non-existent-file.js');
      expect(issues).toEqual([]);
    });
    
    test('should handle unsupported file types', async () => {
      const issues = await analyzeFile('test.txt');
      expect(issues).toEqual([]);
    });
    
    test('should handle malformed content gracefully', () => {
      const content = 'function incomplete(';
      const issues = analyzeNamingConventions(content, 'javascript', 'test.js');
      // Should not throw error
      expect(Array.isArray(issues)).toBe(true);
    });
  });
});

describe('GitHub Action Integration', () => {
  // These would be integration tests for the GitHub Action
  // In a real scenario, you'd test the action's main functions
  
  test('should sanitize input correctly', () => {
    // Test input sanitization functions
    // This would require importing from the action file
  });
  
  test('should create proper comment format', () => {
    // Test comment creation functions
  });
});

// Performance tests
describe('Performance', () => {
  test('should handle large files efficiently', async () => {
    const startTime = Date.now();
    
    // Create a large test file
    const largeContent = Array(1000).fill('const validLine = "test";').join('\n');
    const testFile = 'large-test.js';
    
    await fs.writeFile(testFile, largeContent);
    
    try {
      const issues = await analyzeFile(testFile);
      const endTime = Date.now();
      
      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(Array.isArray(issues)).toBe(true);
      
    } finally {
      await fs.unlink(testFile).catch(() => {});
    }
  });
});
