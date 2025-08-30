/**
 * Comprehensive Test Suite for Best Practices Analyzer
 * 
 * This test suite provides thorough testing of the analyzer's functionality
 * including error handling, performance metrics, and multi-language support.
 */

const fs = require('fs').promises;
const path = require('path');
const { analyzeFile } = require('../scripts/best-practices-analyzer');

// Mock test files directory
const TEST_FILES_DIR = path.join(__dirname, 'fixtures');

describe('Best Practices Analyzer - Comprehensive Tests', () => {
  beforeAll(async () => {
    // Create test fixtures directory
    try {
      await fs.mkdir(TEST_FILES_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rmdir(TEST_FILES_DIR, { recursive: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('Security and Validation', () => {
    test('should reject directory traversal attempts', async () => {
      const result = await analyzeFile('../../../etc/passwd');
      expect(result.success).toBe(false);
      expect(result.error).toContain('directory traversal');
    });

    test('should reject absolute paths', async () => {
      const result = await analyzeFile('/usr/bin/malicious');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Absolute paths not allowed');
    });

    test('should reject unsupported file extensions', async () => {
      const result = await analyzeFile('document.pdf');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file extension');
    });

    test('should handle null and undefined inputs', async () => {
      const result1 = await analyzeFile(null);
      const result2 = await analyzeFile(undefined);
      
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe('Multi-Language Support', () => {
    const testCases = [
      {
        language: 'javascript',
        extension: '.js',
        content: `
function badFunctionName() {
  var x = 1;
  console.log('debug');
  return x;
}
        `
      },
      {
        language: 'python',
        extension: '.py',
        content: `
def bad_function():
    x = 1
    print("debug")
    return x
        `
      },
      {
        language: 'java',
        extension: '.java',
        content: `
public class Test {
  public void badMethod() {
    int x = 1;
    System.out.println("debug");
  }
}
        `
      },
      {
        language: 'go',
        extension: '.go',
        content: `
package main

func badFunction() {
  x := 1
  fmt.Println("debug")
  return x
}
        `
      },
      {
        language: 'rust',
        extension: '.rs',
        content: `
fn bad_function() {
  let x = 1;
  println!("debug");
  return x;
}
        `
      }
    ];

    testCases.forEach(({ language, extension, content }) => {
      test(`should analyze ${language} files correctly`, async () => {
        const testFile = path.join(TEST_FILES_DIR, `test${extension}`);
        await fs.writeFile(testFile, content, 'utf8');
        
        const result = await analyzeFile(path.relative(process.cwd(), testFile));
        
        expect(result.success).toBe(true);
        expect(result.language).toBe(language);
        expect(Array.isArray(result.issues)).toBe(true);
        expect(result.stats).toBeDefined();
        expect(result.analysisMetrics).toBeDefined();
      });
    });
  });

  describe('Issue Detection', () => {
    test('should detect naming convention violations', async () => {
      const jsFile = path.join(TEST_FILES_DIR, 'naming.js');
      const content = `
function bad_function_name() {
  let BadVariableName = 1;
  return BadVariableName;
}

class badClassName {
  constructor() {
    this.bad_property = 1;
  }
}
      `;
      
      await fs.writeFile(jsFile, content, 'utf8');
      const result = await analyzeFile(path.relative(process.cwd(), jsFile));
      
      expect(result.success).toBe(true);
      const namingIssues = result.issues.filter(issue => issue.type === 'naming');
      expect(namingIssues.length).toBeGreaterThan(0);
    });

    test('should detect long functions', async () => {
      const jsFile = path.join(TEST_FILES_DIR, 'long-function.js');
      const longFunction = `
function veryLongFunction() {
  let result = 0;
${Array.from({length: 60}, (_, i) => `  result += ${i}; // Line ${i}`).join('\n')}
  return result;
}
      `;
      
      await fs.writeFile(jsFile, longFunction, 'utf8');
      const result = await analyzeFile(path.relative(process.cwd(), jsFile));
      
      expect(result.success).toBe(true);
      const lengthIssues = result.issues.filter(issue => issue.type === 'function-length');
      expect(lengthIssues.length).toBeGreaterThan(0);
    });

    test('should detect long lines', async () => {
      const jsFile = path.join(TEST_FILES_DIR, 'long-lines.js');
      const content = `
// This is a very long line that exceeds the maximum allowed length and should trigger a warning in the code analyzer tool
const veryLongVariableNameThatExceedsTheRecommendedLengthAndShouldBeRefactored = 'value';
      `;
      
      await fs.writeFile(jsFile, content, 'utf8');
      const result = await analyzeFile(path.relative(process.cwd(), jsFile));
      
      expect(result.success).toBe(true);
      const lineLengthIssues = result.issues.filter(issue => issue.type === 'line-length');
      expect(lineLengthIssues.length).toBeGreaterThan(0);
    });

    test('should detect code duplication', async () => {
      const jsFile = path.join(TEST_FILES_DIR, 'duplication.js');
      const content = `
function processDataA(data) {
  if (data && data.length > 0) {
    return data.map(item => item.value);
  }
  return [];
}

function processDataB(info) {
  if (info && info.length > 0) {
    return info.map(item => item.value);
  }
  return [];
}
      `;
      
      await fs.writeFile(jsFile, content, 'utf8');
      const result = await analyzeFile(path.relative(process.cwd(), jsFile));
      
      expect(result.success).toBe(true);
      const duplicationIssues = result.issues.filter(issue => issue.type === 'duplication');
      expect(duplicationIssues.length).toBeGreaterThan(0);
    });

    test('should detect language-specific issues', async () => {
      const jsFile = path.join(TEST_FILES_DIR, 'js-specific.js');
      const content = `
function testFunction() {
  console.log('Debug message');
  console.error('Error message');
  alert('User alert');
  debugger;
}
      `;
      
      await fs.writeFile(jsFile, content, 'utf8');
      const result = await analyzeFile(path.relative(process.cwd(), jsFile));
      
      expect(result.success).toBe(true);
      const jsIssues = result.issues.filter(issue => issue.type === 'language-specific');
      expect(jsIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent files gracefully', async () => {
      const result = await analyzeFile('non-existent-file.js');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not accessible');
    });

    test('should handle empty files', async () => {
      const emptyFile = path.join(TEST_FILES_DIR, 'empty.js');
      await fs.writeFile(emptyFile, '', 'utf8');
      
      const result = await analyzeFile(path.relative(process.cwd(), emptyFile));
      expect(result.success).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('should handle very small files', async () => {
      const smallFile = path.join(TEST_FILES_DIR, 'small.js');
      await fs.writeFile(smallFile, '// hi', 'utf8');
      
      const result = await analyzeFile(path.relative(process.cwd(), smallFile));
      expect(result.success).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('should handle files with special characters', async () => {
      const specialFile = path.join(TEST_FILES_DIR, 'special.js');
      const content = `
function test() {
  const emoji = '🚀';
  const unicode = 'café';
  const symbols = '!@#$%^&*()';
  return emoji + unicode + symbols;
}
      `;
      
      await fs.writeFile(specialFile, content, 'utf8');
      const result = await analyzeFile(path.relative(process.cwd(), specialFile));
      
      expect(result.success).toBe(true);
      expect(result.language).toBe('javascript');
    });
  });

  describe('Performance Metrics', () => {
    test('should include comprehensive metrics', async () => {
      const testFile = path.join(TEST_FILES_DIR, 'metrics.js');
      const content = `
function testFunction() {
  const variable = 'test';
  return variable;
}
      `;
      
      await fs.writeFile(testFile, content, 'utf8');
      const result = await analyzeFile(path.relative(process.cwd(), testFile));
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.size).toBeGreaterThan(0);
      expect(result.stats.lines).toBeGreaterThan(0);
      expect(result.stats.modified).toBeDefined();
      
      expect(result.analysisMetrics).toBeDefined();
      expect(result.analysisMetrics.totalChecks).toBeGreaterThan(0);
      expect(result.analysisMetrics.contentLength).toBeGreaterThan(0);
      expect(result.analysisMetrics.linesAnalyzed).toBeGreaterThan(0);
    });

    test('should track file path correctly', async () => {
      const testFile = path.join(TEST_FILES_DIR, 'path-test.js');
      await fs.writeFile(testFile, 'function test() {}', 'utf8');
      
      const relativePath = path.relative(process.cwd(), testFile);
      const result = await analyzeFile(relativePath);
      
      expect(result.success).toBe(true);
      expect(result.filePath).toBe(relativePath);
    });
  });

  describe('Integration Tests', () => {
    test('should handle mixed file analysis', async () => {
      const files = [
        { name: 'mixed1.js', content: 'function test() { console.log("test"); }' },
        { name: 'mixed2.py', content: 'def test():\n    print("test")' },
        { name: 'mixed3.java', content: 'class Test { void test() {} }' }
      ];

      // Create test files
      const createdFiles = [];
      for (const file of files) {
        const filePath = path.join(TEST_FILES_DIR, file.name);
        await fs.writeFile(filePath, file.content, 'utf8');
        createdFiles.push(path.relative(process.cwd(), filePath));
      }

      // Analyze all files
      const results = await Promise.all(
        createdFiles.map(filePath => analyzeFile(filePath))
      );

      // Verify all analyses succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.language).toBeDefined();
        expect(result.filePath).toBe(createdFiles[index]);
      });

      // Verify different languages detected
      const languages = results.map(r => r.language);
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('java');
    });

    test('should maintain issue consistency', async () => {
      const testFile = path.join(TEST_FILES_DIR, 'consistency.js');
      const content = `
function test() {
  var x = 1; // Short variable name
  console.log(x); // Console usage
}
      `;
      
      await fs.writeFile(testFile, content, 'utf8');
      
      // Run analysis multiple times
      const results = await Promise.all([
        analyzeFile(path.relative(process.cwd(), testFile)),
        analyzeFile(path.relative(process.cwd(), testFile)),
        analyzeFile(path.relative(process.cwd(), testFile))
      ]);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Issue counts should be consistent
      const issueCounts = results.map(r => r.issues.length);
      expect(new Set(issueCounts).size).toBe(1); // All counts should be the same
    });
  });
});
