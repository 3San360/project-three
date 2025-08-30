#!/usr/bin/env node

/**
 * Custom Best Practices Analyzer
 * 
 * This script analyzes code files for common best practices violations
 * including naming conventions, function length, code duplication,
 * unused variables, and other quality issues.
 * 
 * Security considerations:
 * - File path validation to prevent directory traversal
 * - Limited file size processing to prevent DoS
 * - Safe regex patterns to prevent ReDoS attacks
 * - Input validation and sanitization
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const MAX_FUNCTION_LENGTH = 50; // Maximum lines per function
const MAX_LINE_LENGTH = 120; // Maximum characters per line
const MIN_VARIABLE_NAME_LENGTH = 2; // Minimum variable name length
const PERFORMANCE_THRESHOLD_MS = 1000; // Performance warning threshold

// Performance metrics
class PerformanceMetrics {
  constructor() {
    this.startTime = Date.now();
    this.fileMetrics = new Map();
    this.totalIssues = 0;
    this.totalFiles = 0;
    this.errors = [];
    this.warnings = [];
  }

  startFileAnalysis(filePath) {
    this.fileMetrics.set(filePath, {
      startTime: Date.now(),
      issues: 0,
      size: 0,
      lines: 0
    });
  }

  endFileAnalysis(filePath, issues, fileStats = {}) {
    const metrics = this.fileMetrics.get(filePath);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.issues = issues.length;
      metrics.size = fileStats.size || 0;
      metrics.lines = fileStats.lines || 0;
      
      this.totalIssues += issues.length;
      
      // Performance warning
      if (metrics.duration > PERFORMANCE_THRESHOLD_MS) {
        this.warnings.push(`Slow analysis for ${filePath}: ${metrics.duration}ms`);
      }
    }
    this.totalFiles++;
  }

  addError(error, filePath = null) {
    this.errors.push({ error, filePath, timestamp: Date.now() });
  }

  addWarning(warning, filePath = null) {
    this.warnings.push({ warning, filePath, timestamp: Date.now() });
  }

  getSummary() {
    const totalDuration = Date.now() - this.startTime;
    const avgTimePerFile = this.totalFiles > 0 ? totalDuration / this.totalFiles : 0;
    
    return {
      totalDuration,
      totalFiles: this.totalFiles,
      totalIssues: this.totalIssues,
      avgTimePerFile: Math.round(avgTimePerFile),
      avgIssuesPerFile: this.totalFiles > 0 ? (this.totalIssues / this.totalFiles).toFixed(2) : 0,
      errors: this.errors.length,
      warnings: this.warnings.length,
      fileMetrics: Array.from(this.fileMetrics.entries()).map(([path, metrics]) => ({
        path,
        ...metrics
      }))
    };
  }
}

// Supported file extensions and their patterns
const FILE_PATTERNS = {
  javascript: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    patterns: {
      function: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)|(\w+)\s*\([^)]*\)\s*\{|(\w+)\s*:\s*(?:function|\([^)]*\)\s*=>))/g,
      variable: /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      class: /class\s+([A-Z][a-zA-Z0-9_]*)/g,
      console: /console\.(log|warn|error|info|debug|trace|table|time|timeEnd)/g,
      arrow: /(\w+)\s*=>\s*/g,
      comment: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      import: /import\s+(?:.*\s+from\s+)?['"`]([^'"`]+)['"`]/g,
      export: /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
      typescript: /:\s*\w+[\[\]<>]*\s*[=;]/g, // Type annotations
      interface: /interface\s+([A-Z][a-zA-Z0-9_]*)/g,
      type: /type\s+([A-Z][a-zA-Z0-9_]*)/g
    }
  },
  python: {
    extensions: ['.py'],
    patterns: {
      function: /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
      variable: /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
      class: /class\s+([A-Z][a-zA-Z0-9_]*)/g,
      import: /(?:from\s+[\w.]+\s+)?import\s+([a-zA-Z_][a-zA-Z0-9_.,\s]*)/g,
      comment: /#.*$/gm,
      docstring: /"""[\s\S]*?"""|'''[\s\S]*?'''/g,
      decorator: /@\w+/g,
      lambda: /lambda\s+[^:]*:/g
    }
  },
  java: {
    extensions: ['.java'],
    patterns: {
      function: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g,
      variable: /(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      class: /(?:public|private|protected)?\s*class\s+([A-Z][a-zA-Z0-9_]*)/g,
      comment: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      import: /import\s+([a-zA-Z_][a-zA-Z0-9_.*]*);/g
    }
  },
  go: {
    extensions: ['.go'],
    patterns: {
      function: /func\s+(\w+)\s*\(/g,
      variable: /(?:var|:=)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      struct: /type\s+([A-Z][a-zA-Z0-9_]*)\s+struct/g,
      comment: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      import: /import\s+"([^"]+)"/g
    }
  },
  rust: {
    extensions: ['.rs'],
    patterns: {
      function: /fn\s+(\w+)\s*\(/g,
      variable: /let\s+(?:mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/g,
      struct: /struct\s+([A-Z][a-zA-Z0-9_]*)/g,
      comment: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      macro: /(\w+)!/g
    }
  }
};

/**
 * Enhanced file validation with comprehensive checks
 * @param {string} filePath - Path to validate
 * @returns {Object} Validation result
 */
function validateFile(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'Invalid file path type' };
  }
  
  // Prevent directory traversal
  if (filePath.includes('..') || filePath.includes('~')) {
    return { valid: false, error: 'Potential directory traversal detected' };
  }
  
  // Ensure it's a relative path
  if (path.isAbsolute(filePath)) {
    return { valid: false, error: 'Absolute paths not allowed' };
  }
  
  // Check file extension
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) {
    return { valid: false, error: 'File has no extension' };
  }
  
  // Check for supported extensions
  const supportedExts = Object.values(FILE_PATTERNS)
    .flatMap(lang => lang.extensions);
  
  if (!supportedExts.includes(ext)) {
    return { valid: false, error: `Unsupported file extension: ${ext}` };
  }
  
  return { valid: true };
}

/**
 * Validates file path for security
 * @param {string} filePath - Path to validate
 * @returns {boolean} True if path is safe
 */
function isValidFilePath(filePath) {
  const validation = validateFile(filePath);
  return validation.valid;
}

/**
 * Determines the language type from file extension
 * @param {string} filePath - File path
 * @returns {string|null} Language type or null
 */
function getLanguageType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  for (const [langType, config] of Object.entries(FILE_PATTERNS)) {
    if (config.extensions.includes(ext)) {
      return langType;
    }
  }
  
  return null;
}

/**
 * Enhanced file reading with comprehensive validation and error handling
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} Result object with content or error
 */
async function safeReadFile(filePath) {
  try {
    // Validate file path first
    const validation = validateFile(filePath);
    if (!validation.valid) {
      return { 
        success: false, 
        error: validation.error,
        filePath 
      };
    }

    // Check if file exists
    try {
      await fs.access(filePath, fs.constants.F_OK);
    } catch (accessError) {
      return { 
        success: false, 
        error: `File not accessible: ${accessError.message}`,
        filePath 
      };
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Check if it's actually a file
    if (!stats.isFile()) {
      return { 
        success: false, 
        error: 'Path is not a file',
        filePath 
      };
    }
    
    // Check file size to prevent memory exhaustion
    if (stats.size > MAX_FILE_SIZE) {
      return { 
        success: false, 
        error: `File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`,
        filePath 
      };
    }

    // Check for empty files
    if (stats.size === 0) {
      return { 
        success: false, 
        error: 'File is empty',
        filePath 
      };
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Validate content
    if (typeof content !== 'string') {
      return { 
        success: false, 
        error: 'File content is not valid text',
        filePath 
      };
    }

    return { 
      success: true, 
      content, 
      stats: {
        size: stats.size,
        modified: stats.mtime,
        lines: content.split('\n').length
      },
      filePath 
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Unexpected error reading file: ${error.message}`,
      filePath 
    };
  }
}

/**
 * Removes comments and strings to avoid false positives
 * @param {string} content - File content
 * @param {string} langType - Language type
 * @returns {string} Cleaned content
 */
function removeCommentsAndStrings(content, langType) {
  const patterns = FILE_PATTERNS[langType]?.patterns;
  if (!patterns?.comment) {
    return content;
  }
  
  let cleaned = content;
  
  // Remove comments
  cleaned = cleaned.replace(patterns.comment, '');
  
  // Remove string literals (basic pattern, not perfect but safe)
  if (langType === 'javascript') {
    // Remove template literals, single and double quotes
    cleaned = cleaned.replace(/`(?:[^`\\]|\\.)*`/g, '""');
    cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, '""');
    cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  } else if (langType === 'python') {
    // Remove triple quotes and regular quotes
    cleaned = cleaned.replace(/"""[\s\S]*?"""/g, '""');
    cleaned = cleaned.replace(/'''[\s\S]*?'''/g, '""');
    cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, '""');
    cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  }
  
  return cleaned;
}

/**
 * Analyzes naming conventions
 * @param {string} content - File content
 * @param {string} langType - Language type
 * @param {string} filePath - File path for context
 * @returns {Array} Array of issues
 */
function analyzeNamingConventions(content, langType, filePath) {
  const issues = [];
  const patterns = FILE_PATTERNS[langType]?.patterns;
  
  if (!patterns) return issues;
  
  const lines = content.split('\n');
  
  // Check function names
  if (patterns.function) {
    let match;
    const funcRegex = new RegExp(patterns.function.source, patterns.function.flags);
    
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2];
      if (!funcName) continue;
      
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      // Check naming convention based on language
      if (langType === 'javascript') {
        if (!/^[a-z][a-zA-Z0-9]*$/.test(funcName) && funcName !== 'constructor') {
          issues.push({
            file: filePath,
            line: lineNum,
            column: 1,
            severity: 'warning',
            message: `Function '${funcName}' should use camelCase naming convention`,
            rule: 'naming-convention-function',
            suggestion: `Consider renaming to follow camelCase pattern (e.g., ${funcName.charAt(0).toLowerCase() + funcName.slice(1)})`
          });
        }
      } else if (langType === 'python') {
        if (!/^[a-z][a-z0-9_]*$/.test(funcName) && !funcName.startsWith('__')) {
          issues.push({
            file: filePath,
            line: lineNum,
            column: 1,
            severity: 'warning',
            message: `Function '${funcName}' should use snake_case naming convention`,
            rule: 'naming-convention-function',
            suggestion: `Consider renaming to follow snake_case pattern (e.g., ${funcName.replace(/[A-Z]/g, (match, offset) => offset > 0 ? '_' + match.toLowerCase() : match.toLowerCase())})`
          });
        }
      }
      
      // Check for too short names
      if (funcName.length < MIN_VARIABLE_NAME_LENGTH && !/^[a-z]$/.test(funcName)) {
        issues.push({
          file: filePath,
          line: lineNum,
          column: 1,
          severity: 'warning',
          message: `Function name '${funcName}' is too short and not descriptive`,
          rule: 'naming-convention-length',
          suggestion: 'Use more descriptive function names to improve code readability'
        });
      }
    }
  }
  
  // Check variable names
  if (patterns.variable) {
    let match;
    const varRegex = new RegExp(patterns.variable.source, patterns.variable.flags);
    
    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1];
      if (!varName) continue;
      
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      // Check for single letter variables (except common ones like i, j, k)
      if (varName.length === 1 && !/^[ijkxyz]$/.test(varName)) {
        issues.push({
          file: filePath,
          line: lineNum,
          column: 1,
          severity: 'warning',
          message: `Variable '${varName}' has a non-descriptive single letter name`,
          rule: 'naming-convention-descriptive',
          suggestion: 'Use descriptive variable names to improve code readability'
        });
      }
    }
  }
  
  return issues;
}

/**
 * Analyzes function length and complexity
 * @param {string} content - File content
 * @param {string} langType - Language type
 * @param {string} filePath - File path for context
 * @returns {Array} Array of issues
 */
function analyzeFunctionLength(content, langType, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  if (langType === 'javascript') {
    // Find function declarations and expressions
    const funcPattern = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>))/g;
    let match;
    
    while ((match = funcPattern.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      const funcStart = match.index;
      
      // Find the opening brace
      let braceCount = 0;
      let funcEnd = funcStart;
      let foundStart = false;
      
      for (let i = funcStart; i < content.length; i++) {
        const char = content[i];
        if (char === '{') {
          braceCount++;
          if (!foundStart) foundStart = true;
        } else if (char === '}') {
          braceCount--;
          if (foundStart && braceCount === 0) {
            funcEnd = i;
            break;
          }
        }
      }
      
      if (foundStart) {
        const funcContent = content.substring(funcStart, funcEnd + 1);
        const funcLines = funcContent.split('\n').length;
        
        if (funcLines > MAX_FUNCTION_LENGTH) {
          issues.push({
            file: filePath,
            line: startLine,
            column: 1,
            severity: 'warning',
            message: `Function is too long (${funcLines} lines, max ${MAX_FUNCTION_LENGTH})`,
            rule: 'function-length',
            suggestion: 'Consider breaking this function into smaller, more focused functions'
          });
        }
      }
    }
  } else if (langType === 'python') {
    // Find function definitions
    const funcPattern = /def\s+\w+\s*\([^)]*\):/g;
    let match;
    
    while ((match = funcPattern.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      const lineIndex = startLine - 1;
      
      // Find the end of the function by indentation
      const funcIndent = lines[lineIndex].match(/^\s*/)[0].length;
      let endLine = startLine;
      
      for (let i = lineIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue; // Skip empty lines
        
        const lineIndent = lines[i].match(/^\s*/)[0].length;
        if (lineIndent <= funcIndent && line !== '') {
          endLine = i;
          break;
        }
        endLine = i + 1;
      }
      
      const funcLines = endLine - startLine + 1;
      if (funcLines > MAX_FUNCTION_LENGTH) {
        issues.push({
          file: filePath,
          line: startLine,
          column: 1,
          severity: 'warning',
          message: `Function is too long (${funcLines} lines, max ${MAX_FUNCTION_LENGTH})`,
          rule: 'function-length',
          suggestion: 'Consider breaking this function into smaller, more focused functions'
        });
      }
    }
  }
  
  return issues;
}

/**
 * Analyzes line length
 * @param {string} content - File content
 * @param {string} filePath - File path for context
 * @returns {Array} Array of issues
 */
function analyzeLineLength(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.length > MAX_LINE_LENGTH) {
      issues.push({
        file: filePath,
        line: index + 1,
        column: MAX_LINE_LENGTH + 1,
        severity: 'warning',
        message: `Line too long (${line.length} characters, max ${MAX_LINE_LENGTH})`,
        rule: 'line-length',
        suggestion: 'Consider breaking long lines into multiple lines for better readability'
      });
    }
  });
  
  return issues;
}

/**
 * Detects code duplication (simple pattern matching)
 * @param {string} content - File content
 * @param {string} filePath - File path for context
 * @returns {Array} Array of issues
 */
function analyzeCodeDuplication(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  const minDuplicationLength = 5; // Minimum lines to consider duplication
  
  // Simple duplication detection by comparing line sequences
  const lineGroups = new Map();
  
  for (let i = 0; i <= lines.length - minDuplicationLength; i++) {
    const sequence = lines.slice(i, i + minDuplicationLength)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'))
      .join('\n');
    
    if (sequence.length < 50) continue; // Skip very short sequences
    
    if (!lineGroups.has(sequence)) {
      lineGroups.set(sequence, []);
    }
    lineGroups.get(sequence).push(i + 1);
  }
  
  // Report duplications
  for (const [sequence, locations] of lineGroups) {
    if (locations.length > 1) {
      locations.forEach(lineNum => {
        issues.push({
          file: filePath,
          line: lineNum,
          column: 1,
          severity: 'warning',
          message: `Potential code duplication detected (also found at lines: ${locations.filter(l => l !== lineNum).join(', ')})`,
          rule: 'code-duplication',
          suggestion: 'Consider extracting common code into a reusable function or method'
        });
      });
    }
  }
  
  return issues;
}

/**
 * Analyzes language-specific issues
 * @param {string} content - File content
 * @param {string} langType - Language type
 * @param {string} filePath - File path for context
 * @returns {Array} Array of issues
 */
function analyzeLanguageSpecific(content, langType, filePath) {
  const issues = [];
  const patterns = FILE_PATTERNS[langType]?.patterns;
  
  if (langType === 'javascript' && patterns) {
    // Check for console statements in production code
    let match;
    const consoleRegex = new RegExp(patterns.console.source, patterns.console.flags);
    
    while ((match = consoleRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      issues.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: `Console statement found: ${match[0]}`,
        rule: 'no-console',
        suggestion: 'Remove console statements before production deployment or use a proper logging library'
      });
    }
    
    // Check for var usage (prefer let/const)
    const varPattern = /\bvar\s+/g;
    while ((match = varPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      issues.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: 'Use of "var" keyword detected',
        rule: 'no-var',
        suggestion: 'Use "let" or "const" instead of "var" for better scoping'
      });
    }
    
    // Check for == instead of ===
    const equalityPattern = /[^=!]==[^=]/g;
    while ((match = equalityPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      issues.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: 'Use strict equality (===) instead of loose equality (==)',
        rule: 'prefer-strict-equality',
        suggestion: 'Use === for strict equality comparison to avoid type coercion issues'
      });
    }
    
    // Check for any/unknown types in TypeScript
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      const anyTypePattern = /:\s*any\b/g;
      while ((match = anyTypePattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        
        issues.push({
          file: filePath,
          line: lineNum,
          column: 1,
          severity: 'warning',
          message: 'Avoid using "any" type',
          rule: 'no-any-type',
          suggestion: 'Use specific types instead of "any" to maintain type safety'
        });
      }
    }
    
    // Check for TODO/FIXME comments
    const todoPattern = /\/\/\s*(TODO|FIXME|HACK|XXX):/gi;
    while ((match = todoPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      issues.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: 'info',
        message: `${match[1]} comment found`,
        rule: 'todo-comment',
        suggestion: 'Consider creating a ticket or issue to track this work'
      });
    }
  }
  
  if (langType === 'python' && patterns) {
    // Check for bare except clauses
    const bareExceptPattern = /except\s*:/g;
    while ((match = bareExceptPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      issues.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: 'Bare except clause detected',
        rule: 'no-bare-except',
        suggestion: 'Specify the exception type or use "except Exception:" for better error handling'
      });
    }
    
    // Check for print statements (prefer logging)
    const printPattern = /\bprint\s*\(/g;
    while ((match = printPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      issues.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: 'info',
        message: 'Print statement found',
        rule: 'no-print',
        suggestion: 'Consider using logging module instead of print for better control'
      });
    }
    
    // Check for global keyword usage
    const globalPattern = /\bglobal\s+\w+/g;
    while ((match = globalPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      issues.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: 'Global variable usage detected',
        rule: 'no-global',
        suggestion: 'Avoid global variables; consider passing parameters or using class attributes'
      });
    }
  }
  
  return issues;
}

/**
 * Main analysis function for a single file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array>} Array of issues found
 */
async function analyzeFile(filePath) {
  try {
    // Validate file path
    const validation = validateFile(filePath);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        filePath
      };
    }
    
    const langType = getLanguageType(filePath);
    if (!langType) {
      return {
        success: false,
        error: 'Unsupported file type',
        filePath
      };
    }
    
    // Read file with enhanced error handling
    const fileResult = await safeReadFile(filePath);
    if (!fileResult.success) {
      return {
        success: false,
        error: fileResult.error,
        filePath
      };
    }
    
    const { content, stats } = fileResult;
    
    // Early return for very small files
    if (content.trim().length < 10) {
      return {
        success: true,
        issues: [],
        language: langType,
        stats,
        filePath
      };
    }
    
    const cleanContent = removeCommentsAndStrings(content, langType);
    
    // Run all analysis functions in parallel for better performance
    const analysisPromises = [
      analyzeNamingConventions(cleanContent, langType, filePath),
      analyzeFunctionLength(cleanContent, langType, filePath),
      analyzeLineLength(content, filePath), // Use original content for line length
      analyzeCodeDuplication(cleanContent, filePath),
      analyzeLanguageSpecific(cleanContent, langType, filePath)
    ];
    
    try {
      const results = await Promise.all(analysisPromises);
      const allIssues = results.flat();
      
      // Sort issues by line number for better readability
      const sortedIssues = allIssues.sort((a, b) => a.line - b.line);
      
      return {
        success: true,
        issues: sortedIssues,
        language: langType,
        stats,
        filePath,
        analysisMetrics: {
          totalChecks: analysisPromises.length,
          contentLength: content.length,
          cleanedLength: cleanContent.length,
          linesAnalyzed: content.split('\n').length
        }
      };
      
    } catch (analysisError) {
      return {
        success: false,
        error: `Analysis error: ${analysisError.message}`,
        filePath
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
      filePath
    };
  }
}

/**
 * Main entry point
 */
async function main() {
  const metrics = new PerformanceMetrics();
  
  try {
    // Get files from command line argument
    const filesArg = process.argv[2];
    if (!filesArg) {
      console.error('Usage: node best-practices-analyzer.js <files-json>');
      console.error('Example: node best-practices-analyzer.js \'["src/index.js", "lib/utils.py"]\'');
      process.exit(1);
    }
    
    let files;
    try {
      files = JSON.parse(filesArg);
    } catch (error) {
      console.error(`Invalid JSON format for files argument: ${error.message}`);
      console.error('Expected format: \'["file1.js", "file2.py"]\'');
      process.exit(1);
    }
    
    if (!Array.isArray(files)) {
      console.error('Files argument must be a JSON array');
      process.exit(1);
    }

    if (files.length === 0) {
      console.error('No files to analyze');
      process.exit(0);
    }
    
    console.error(`Starting analysis of ${files.length} files...`);
    
    const allIssues = [];
    const fileResults = [];
    
    // Analyze each file with enhanced error handling
    for (const filePath of files) {
      metrics.startFileAnalysis(filePath);
      
      try {
        const result = await analyzeFile(filePath);
        
        if (result.success) {
          allIssues.push(...result.issues);
          fileResults.push({
            filePath,
            success: true,
            issuesCount: result.issues.length,
            language: result.language,
            stats: result.stats
          });
          metrics.endFileAnalysis(filePath, result.issues, result.stats);
          console.error(`✓ ${filePath} - ${result.issues.length} issues (${result.language})`);
        } else {
          fileResults.push({
            filePath,
            success: false,
            error: result.error
          });
          metrics.addError(result.error, filePath);
          metrics.endFileAnalysis(filePath, [], {});
          console.error(`✗ ${filePath} - Error: ${result.error}`);
        }
      } catch (error) {
        fileResults.push({
          filePath,
          success: false,
          error: error.message
        });
        metrics.addError(error.message, filePath);
        metrics.endFileAnalysis(filePath, [], {});
        console.error(`✗ ${filePath} - Unexpected error: ${error.message}`);
      }
    }
    
    // Generate comprehensive results
    const summary = metrics.getSummary();
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        filesAnalyzed: summary.totalFiles,
        successfulAnalyses: fileResults.filter(f => f.success).length,
        failedAnalyses: fileResults.filter(f => !f.success).length,
        totalIssues: summary.totalIssues,
        totalDuration: summary.totalDuration,
        avgTimePerFile: summary.avgTimePerFile,
        avgIssuesPerFile: summary.avgIssuesPerFile
      },
      performance: {
        errors: summary.errors,
        warnings: summary.warnings,
        slowFiles: summary.fileMetrics
          .filter(f => f.duration > PERFORMANCE_THRESHOLD_MS)
          .sort((a, b) => b.duration - a.duration)
      },
      files: fileResults,
      issues: allIssues.map(issue => ({
        ...issue,
        id: `${issue.file}-${issue.line}-${issue.type}-${Date.now()}`
      }))
    };
    
    // Output results as JSON to stdout
    console.log(JSON.stringify(results, null, 2));
    
    // Summary to stderr
    console.error('\n=== Analysis Summary ===');
    console.error(`Total files: ${summary.totalFiles}`);
    console.error(`Successful: ${results.summary.successfulAnalyses}`);
    console.error(`Failed: ${results.summary.failedAnalyses}`);
    console.error(`Total issues: ${summary.totalIssues}`);
    console.error(`Duration: ${summary.totalDuration}ms`);
    console.error(`Average per file: ${summary.avgTimePerFile}ms`);
    
    if (summary.errors > 0) {
      console.error(`\n⚠️  ${summary.errors} errors occurred during analysis`);
    }
    
    if (summary.warnings > 0) {
      console.error(`⚠️  ${summary.warnings} performance warnings`);
    }
    
    // Exit with appropriate code
    process.exit(results.summary.failedAnalyses > 0 ? 1 : 0);
    
  } catch (error) {
    metrics.addError(error.message);
    console.error(`\n❌ Analysis failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeFile,
  analyzeNamingConventions,
  analyzeFunctionLength,
  analyzeLineLength,
  analyzeCodeDuplication,
  analyzeLanguageSpecific
};
