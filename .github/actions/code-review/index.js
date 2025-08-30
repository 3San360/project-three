/**
 * GitHub Action: Code Review Processor
 * 
 * This action processes linting results from various tools and creates
 * inline comments on pull requests with suggestions and best practices.
 * 
 * Security considerations:
 * - Validates all inputs to prevent injection attacks
 * - Limits comment size to prevent spam
 * - Sanitizes user content before posting
 * - Uses read-only file access patterns
 * - Properly handles GitHub API rate limits
 */

const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs').promises;
const path = require('path');

// Constants for security and rate limiting
const MAX_COMMENT_LENGTH = 2000;
const MAX_COMMENTS_PER_PR = 50;
const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.php', '.rb'];

/**
 * Sanitizes text content to prevent XSS and injection attacks
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/[<>&"']/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[char];
    })
    .substring(0, MAX_COMMENT_LENGTH);
}

/**
 * Validates file path to prevent directory traversal attacks
 * @param {string} filePath - The file path to validate
 * @returns {boolean} True if the path is safe
 */
function isValidFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  // Prevent directory traversal
  if (filePath.includes('..') || filePath.includes('~') || path.isAbsolute(filePath)) {
    return false;
  }
  
  // Check for supported file extensions
  const ext = path.extname(filePath);
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Safely reads and parses a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object|null>} Parsed JSON object or null if error
 */
async function safeReadJsonFile(filePath) {
  try {
    if (!filePath || !(await fs.access(filePath).then(() => true).catch(() => false))) {
      return null;
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    
    // Validate file size to prevent memory exhaustion
    if (content.length > 10 * 1024 * 1024) { // 10MB limit
      core.warning(`File ${filePath} is too large, skipping`);
      return null;
    }
    
    return JSON.parse(content);
  } catch (error) {
    core.warning(`Failed to read or parse ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Safely reads a JSONL (JSON Lines) file
 * @param {string} filePath - Path to the JSONL file
 * @returns {Promise<Array>} Array of parsed JSON objects
 */
async function safeReadJsonlFile(filePath) {
  try {
    if (!filePath || !(await fs.access(filePath).then(() => true).catch(() => false))) {
      return [];
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    
    // Validate file size
    if (content.length > 10 * 1024 * 1024) { // 10MB limit
      core.warning(`File ${filePath} is too large, skipping`);
      return [];
    }
    
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter(obj => obj && typeof obj === 'object');
  } catch (error) {
    core.warning(`Failed to read or parse JSONL ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Processes ESLint results and converts them to standardized format
 * @param {string} filePath - Path to ESLint results file
 * @returns {Promise<Array>} Array of standardized issue objects
 */
async function processESLintResults(filePath) {
  const results = await safeReadJsonFile(filePath);
  if (!results || !Array.isArray(results)) {
    return [];
  }
  
  const issues = [];
  
  for (const fileResult of results) {
    if (!fileResult.filePath || !Array.isArray(fileResult.messages)) {
      continue;
    }
    
    // Validate file path for security
    const relativePath = path.relative(process.cwd(), fileResult.filePath);
    if (!isValidFilePath(relativePath)) {
      continue;
    }
    
    for (const message of fileResult.messages) {
      if (!message.line || !message.message) {
        continue;
      }
      
      issues.push({
        file: relativePath,
        line: parseInt(message.line, 10),
        column: parseInt(message.column, 10) || 1,
        severity: message.severity === 2 ? 'error' : 'warning',
        message: sanitizeText(message.message),
        rule: sanitizeText(message.ruleId || 'unknown'),
        tool: 'ESLint'
      });
    }
  }
  
  return issues;
}

/**
 * Processes Flake8 results and converts them to standardized format
 * @param {string} filePath - Path to Flake8 results file
 * @returns {Promise<Array>} Array of standardized issue objects
 */
async function processFlake8Results(filePath) {
  const results = await safeReadJsonlFile(filePath);
  if (!Array.isArray(results)) {
    return [];
  }
  
  const issues = [];
  
  for (const result of results) {
    if (!result.file || !result.line || !result.message) {
      continue;
    }
    
    // Validate file path for security
    if (!isValidFilePath(result.file)) {
      continue;
    }
    
    issues.push({
      file: result.file,
      line: parseInt(result.line, 10),
      column: parseInt(result.column, 10) || 1,
      severity: result.severity === 'E' ? 'error' : 'warning',
      message: sanitizeText(result.message),
      rule: sanitizeText(result.rule || 'unknown'),
      tool: 'Flake8'
    });
  }
  
  return issues;
}

/**
 * Processes custom analysis results
 * @param {string} filePath - Path to custom results file
 * @returns {Promise<Array>} Array of standardized issue objects
 */
async function processCustomResults(filePath) {
  const results = await safeReadJsonFile(filePath);
  if (!results || !Array.isArray(results.issues)) {
    return [];
  }
  
  const issues = [];
  
  for (const issue of results.issues) {
    if (!issue.file || !issue.line || !issue.message) {
      continue;
    }
    
    // Validate file path for security
    if (!isValidFilePath(issue.file)) {
      continue;
    }
    
    issues.push({
      file: issue.file,
      line: parseInt(issue.line, 10),
      column: parseInt(issue.column, 10) || 1,
      severity: issue.severity || 'warning',
      message: sanitizeText(issue.message),
      rule: sanitizeText(issue.rule || 'custom'),
      tool: 'Custom Analysis',
      suggestion: sanitizeText(issue.suggestion || '')
    });
  }
  
  return issues;
}

/**
 * Creates a formatted comment for an issue
 * @param {Object} issue - The issue object
 * @returns {string} Formatted comment text
 */
function createCommentText(issue) {
  let comment = `**${issue.tool}** ${issue.severity === 'error' ? '❌' : '⚠️'}\n\n`;
  comment += `**Rule:** \`${issue.rule}\`\n\n`;
  comment += `**Message:** ${issue.message}\n\n`;
  
  if (issue.suggestion) {
    comment += `**Suggestion:** ${issue.suggestion}\n\n`;
  }
  
  // Add helpful links based on the tool and rule
  if (issue.tool === 'ESLint' && issue.rule !== 'unknown') {
    comment += `[📖 ESLint Rule Documentation](https://eslint.org/docs/rules/${issue.rule})\n`;
  } else if (issue.tool === 'Flake8' && issue.rule !== 'unknown') {
    comment += `[📖 Flake8 Error Code](https://flake8.pycqa.org/en/latest/user/error-codes.html#error-violation-codes)\n`;
  }
  
  return comment;
}

/**
 * Groups issues by file and line for efficient commenting
 * @param {Array} issues - Array of issue objects
 * @returns {Map} Map of file paths to line-grouped issues
 */
function groupIssuesByFileAndLine(issues) {
  const grouped = new Map();
  
  for (const issue of issues) {
    const fileKey = issue.file;
    if (!grouped.has(fileKey)) {
      grouped.set(fileKey, new Map());
    }
    
    const lineKey = issue.line;
    if (!grouped.get(fileKey).has(lineKey)) {
      grouped.get(fileKey).set(lineKey, []);
    }
    
    grouped.get(fileKey).get(lineKey).push(issue);
  }
  
  return grouped;
}

/**
 * Main function that orchestrates the code review process
 */
async function run() {
  try {
    // Get inputs with validation
    const token = core.getInput('github-token', { required: true });
    const eslintResults = core.getInput('eslint-results');
    const flake8Results = core.getInput('flake8-results');
    const customResults = core.getInput('custom-results');
    const prNumber = parseInt(core.getInput('pr-number', { required: true }), 10);
    const baseSha = core.getInput('base-sha', { required: true });
    const headSha = core.getInput('head-sha', { required: true });
    
    // Validate inputs
    if (!token || token.length < 10) {
      throw new Error('Invalid GitHub token provided');
    }
    
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      throw new Error('Invalid PR number provided');
    }
    
    if (!baseSha || !headSha || baseSha.length !== 40 || headSha.length !== 40) {
      throw new Error('Invalid SHA values provided');
    }
    
    // Initialize Octokit with the provided token
    const octokit = github.getOctokit(token);
    const { context } = github;
    
    core.info('🔍 Processing code review results...');
    
    // Process results from different tools
    const [eslintIssues, flake8Issues, customIssues] = await Promise.all([
      processESLintResults(eslintResults),
      processFlake8Results(flake8Results),
      processCustomResults(customResults)
    ]);
    
    // Combine all issues
    const allIssues = [...eslintIssues, ...flake8Issues, ...customIssues];
    
    core.info(`📊 Found ${allIssues.length} total issues`);
    
    if (allIssues.length === 0) {
      // Post a positive summary comment
      await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        body: `## ✅ Code Review Complete\n\nGreat job! No issues were found in the changed files. The code follows best practices and coding standards.\n\n*Automated review by GitHub Actions*`
      });
      
      core.setOutput('issues-found', '0');
      core.setOutput('summary', 'No issues found');
      return;
    }
    
    // Group issues for efficient commenting
    const groupedIssues = groupIssuesByFileAndLine(allIssues);
    
    let commentCount = 0;
    const maxCommentsReached = allIssues.length > MAX_COMMENTS_PER_PR;
    
    // Get PR diff for accurate line mapping
    let prDiff;
    try {
      const diffResponse = await octokit.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber,
        mediaType: {
          format: 'diff'
        }
      });
      prDiff = diffResponse.data;
    } catch (error) {
      core.warning(`Failed to get PR diff: ${error.message}`);
      prDiff = null;
    }
    
    // Create inline comments for each issue
    for (const [filePath, lineMap] of groupedIssues) {
      if (commentCount >= MAX_COMMENTS_PER_PR) {
        core.warning(`Reached maximum comment limit (${MAX_COMMENTS_PER_PR}), stopping`);
        break;
      }
      
      for (const [line, issues] of lineMap) {
        if (commentCount >= MAX_COMMENTS_PER_PR) {
          break;
        }
        
        try {
          // Combine multiple issues on the same line into one comment
          let combinedComment = '';
          if (issues.length === 1) {
            combinedComment = createCommentText(issues[0]);
          } else {
            combinedComment = `**Multiple issues found on this line:**\n\n`;
            issues.forEach((issue, index) => {
              combinedComment += `### ${index + 1}. ${issue.tool} ${issue.severity === 'error' ? '❌' : '⚠️'}\n`;
              combinedComment += `**Rule:** \`${issue.rule}\`\n`;
              combinedComment += `**Message:** ${issue.message}\n`;
              if (issue.suggestion) {
                combinedComment += `**Suggestion:** ${issue.suggestion}\n`;
              }
              combinedComment += '\n---\n\n';
            });
          }
          
          // Create the review comment
          await octokit.rest.pulls.createReviewComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: prNumber,
            body: combinedComment,
            commit_id: headSha,
            path: filePath,
            line: line,
            side: 'RIGHT'
          });
          
          commentCount++;
          core.info(`📝 Created comment for ${filePath}:${line}`);
          
          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          core.warning(`Failed to create comment for ${filePath}:${line}: ${error.message}`);
        }
      }
    }
    
    // Create summary comment
    let summaryText = `## 📋 Code Review Summary\n\n`;
    summaryText += `Found **${allIssues.length}** issues across **${groupedIssues.size}** files.\n\n`;
    
    // Break down by tool
    const toolStats = {};
    allIssues.forEach(issue => {
      if (!toolStats[issue.tool]) {
        toolStats[issue.tool] = { errors: 0, warnings: 0 };
      }
      if (issue.severity === 'error') {
        toolStats[issue.tool].errors++;
      } else {
        toolStats[issue.tool].warnings++;
      }
    });
    
    summaryText += `### Issues by Tool:\n`;
    for (const [tool, stats] of Object.entries(toolStats)) {
      summaryText += `- **${tool}**: ${stats.errors} errors, ${stats.warnings} warnings\n`;
    }
    
    if (maxCommentsReached) {
      summaryText += `\n⚠️ **Note**: Only the first ${MAX_COMMENTS_PER_PR} issues are shown as inline comments to prevent spam.\n`;
    }
    
    summaryText += `\n### Next Steps:\n`;
    summaryText += `1. Review the inline comments above\n`;
    summaryText += `2. Fix the issues and push new changes\n`;
    summaryText += `3. This review will automatically run again\n\n`;
    summaryText += `*Automated review by GitHub Actions*`;
    
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body: summaryText
    });
    
    // Set outputs
    core.setOutput('issues-found', allIssues.length.toString());
    core.setOutput('summary', `Found ${allIssues.length} issues`);
    
    core.info(`✅ Code review complete! Created ${commentCount} inline comments.`);
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    core.error(error.stack || error.toString());
  }
}

// Run the action
if (require.main === module) {
  run();
}

module.exports = { run };
