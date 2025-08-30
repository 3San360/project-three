# Automated Code Review GitHub Action

A comprehensive GitHub Action that automatically reviews pull requests and provides inline comments for code quality issues, best practices violations, and improvement suggestions.

## 🚀 Features

- **Multi-language Support**: JavaScript, TypeScript, Python, Java, Go, Rust, PHP, Ruby
- **Multiple Linters**: ESLint, Flake8, and custom best practices analysis
- **Inline Comments**: Precise feedback directly on the problematic lines
- **Security Focused**: Built with security best practices and input validation
- **Smart Analysis**: Detects naming conventions, function length, code duplication, and more
- **Rate Limited**: Respects GitHub API limits and prevents comment spam
- **Configurable**: Easy to extend with additional rules and languages

## 📋 What It Checks

### JavaScript/TypeScript (ESLint)
- ✅ Unused variables and imports
- ✅ Console statements
- ✅ Code complexity
- ✅ Line length limits
- ✅ Syntax errors
- ✅ Best practices violations

### Python (Flake8)
- ✅ PEP 8 style compliance
- ✅ Syntax errors
- ✅ Import organization
- ✅ Line length limits
- ✅ Code complexity

### Custom Analysis (All Languages)
- ✅ Naming convention violations
- ✅ Function length analysis
- ✅ Code duplication detection
- ✅ Line length enforcement
- ✅ Language-specific best practices

## 🛠️ Setup Instructions

### 1. Copy Files to Your Repository

Copy the following files to your repository:

```
.github/
├── workflows/
│   └── code-review.yml          # Main workflow file
└── actions/
    └── code-review/
        ├── action.yml           # Action definition
        ├── package.json         # Dependencies
        └── index.js            # Action logic
scripts/
└── best-practices-analyzer.js   # Custom analyzer
```

### 2. Install Dependencies

The action will automatically install its dependencies, but if you want to run it locally:

```bash
cd .github/actions/code-review
npm install
```

### 3. Configure GitHub Repository

1. **Enable Actions**: Go to your repository's Settings > Actions and ensure Actions are enabled
2. **Set Permissions**: The workflow uses `GITHUB_TOKEN` with these permissions:
   - `contents: read`
   - `pull-requests: write`
   - `checks: write`
   - `statuses: write`

### 4. Test the Setup

1. Create a new branch with some code changes
2. Open a pull request
3. The action will automatically run and provide feedback

## ⚙️ Configuration

### ESLint Configuration

Create a `.eslintrc.json` file in your repository root to customize ESLint rules:

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "max-len": ["error", { "code": 120 }],
    "complexity": ["error", 10],
    "max-lines-per-function": ["error", 50]
  }
}
```

### Flake8 Configuration

Create a `.flake8` file in your repository root:

```ini
[flake8]
max-line-length = 120
max-complexity = 10
ignore = E203, E501, W503
exclude = .git,__pycache__,venv,env,.env
```

### Custom Analyzer Configuration

Edit `scripts/best-practices-analyzer.js` to modify:

- Maximum function length
- Line length limits
- Naming convention rules
- Code duplication thresholds

## 🔧 Extending the Action

### Adding New Languages

1. **Update the workflow** (`.github/workflows/code-review.yml`):
   ```yaml
   paths:
     - '**/*.your-extension'  # Add your file extension
   ```

2. **Add language support** in `scripts/best-practices-analyzer.js`:
   ```javascript
   const FILE_PATTERNS = {
     // ... existing patterns
     your_language: {
       extensions: ['.your-ext'],
       patterns: {
         function: /your-function-regex/g,
         // ... other patterns
       }
     }
   };
   ```

3. **Add linter integration** in the workflow:
   ```yaml
   - name: 'Run Your Linter'
     run: |
       your-linter --format json > your-results.json
   ```

### Adding New Rules

1. **For ESLint/Flake8**: Update their respective configuration files
2. **For custom rules**: Add new analysis functions in `best-practices-analyzer.js`:

```javascript
function analyzeYourCustomRule(content, langType, filePath) {
  const issues = [];
  // Your analysis logic here
  return issues;
}

// Add to the main analyzeFile function:
const allIssues = [
  // ... existing analyzers
  ...analyzeYourCustomRule(cleanContent, langType, filePath)
];
```

### Customizing Comment Templates

Edit the `createCommentText` function in `.github/actions/code-review/index.js`:

```javascript
function createCommentText(issue) {
  let comment = `**${issue.tool}** ${issue.severity === 'error' ? '❌' : '⚠️'}\n\n`;
  // Customize your comment format here
  return comment;
}
```

## 📊 Example Output

### Inline Comment Example
```markdown
**ESLint** ⚠️

**Rule:** `no-unused-vars`

**Message:** 'userName' is defined but never used.

**Suggestion:** Remove unused variables to keep code clean and maintainable.

📖 ESLint Rule Documentation
```

### Summary Comment Example
```markdown
## 📋 Code Review Summary

Found **8** issues across **3** files.

### Issues by Tool:
- **ESLint**: 3 errors, 2 warnings
- **Flake8**: 1 errors, 1 warnings  
- **Custom Analysis**: 0 errors, 1 warnings

### Next Steps:
1. Review the inline comments above
2. Fix the issues and push new changes
3. This review will automatically run again

*Automated review by GitHub Actions*
```

## 🔒 Security Considerations

This action is built with security as a priority:

### Input Validation
- ✅ File path validation prevents directory traversal
- ✅ File size limits prevent memory exhaustion
- ✅ Content sanitization prevents XSS attacks
- ✅ Regex patterns are ReDoS-safe

### API Security
- ✅ Uses minimal required permissions
- ✅ Secure token handling
- ✅ Rate limiting and error handling
- ✅ No sensitive data in logs

### Repository Security
- ✅ Only runs on same-repository PRs
- ✅ No execution of user-provided code
- ✅ Read-only access to repository content
- ✅ Temporary file cleanup

## 🚫 Limitations

- **Fork Protection**: Won't run on PRs from forks for security reasons
- **File Size**: Limited to 5MB per file for performance
- **Comment Limit**: Maximum 50 inline comments per PR to prevent spam
- **Language Support**: Currently supports 10 programming languages
- **Dependency**: Requires Node.js 18+ runtime environment

## 🐛 Troubleshooting

### Common Issues

1. **Action doesn't run on PRs**
   - Check that the workflow file is in the default branch
   - Verify file paths in the `paths` filter
   - Ensure Actions are enabled in repository settings

2. **No comments appear**
   - Check Action logs for errors
   - Verify `GITHUB_TOKEN` has proper permissions
   - Ensure files have supported extensions

3. **Linter not found errors**
   - The workflow installs linters automatically
   - Check if custom configurations are valid
   - Review the installation steps in the workflow

4. **Rate limiting issues**
   - The action includes built-in rate limiting
   - For high-volume repositories, consider reducing comment frequency
   - Check GitHub API rate limit status

### Debug Mode

Enable debug logging by adding this to your workflow:

```yaml
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

## 📈 Performance Tips

1. **File Filtering**: Use specific path filters to avoid analyzing unnecessary files
2. **Staged Changes**: Consider running only on staged changes for faster feedback
3. **Parallel Execution**: The action already runs linters in parallel
4. **Cache Dependencies**: Leverage GitHub Actions caching for faster builds

## 🤝 Contributing

To contribute to this action:

1. Fork this repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all security checks pass
5. Submit a pull request

### Testing Locally

```bash
# Install dependencies
cd .github/actions/code-review
npm install

# Run the custom analyzer
node scripts/best-practices-analyzer.js '["path/to/file.js"]'

# Test the action logic
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Flake8 Documentation](https://flake8.pycqa.org/en/latest/)
- [GitHub API Reference](https://docs.github.com/en/rest)

## 📞 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review GitHub Actions logs
3. Open an issue with:
   - Repository details
   - Action logs
   - Example files that cause issues
   - Expected vs actual behavior

---

**Built with ❤️ for better code quality and developer productivity**
